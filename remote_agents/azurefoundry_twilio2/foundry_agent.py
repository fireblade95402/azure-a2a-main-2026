"""
AI Foundry Twilio SMS Agent implementation.
Uses Azure AI Agents SDK with function calling to send SMS messages via Twilio.

This agent is designed to be the final step in a workflow, receiving message content
from previous agents and sending it via SMS to the user.
"""
import os
import time
import datetime
import asyncio
import logging
import json
from typing import Optional, Dict, List

from azure.ai.agents import AgentsClient
from azure.ai.agents.models import (
    Agent, ThreadMessage, ThreadRun, AgentThread, ToolOutput, 
    ListSortOrder, FunctionTool, ToolSet
)
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

# Twilio imports
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)


class FoundryTwilioAgent:
    """
    AI Foundry Twilio SMS Agent with function calling capabilities.
    
    This agent uses Azure AI Foundry to process requests and call the send_sms
    function when appropriate to deliver messages via Twilio.
    """
    
    def __init__(self):
        self.endpoint = os.environ["AZURE_AI_FOUNDRY_PROJECT_ENDPOINT"]
        self.credential = DefaultAzureCredential()
        self.agent: Optional[Agent] = None
        self.threads: Dict[str, str] = {}
        self._agents_client = None
        self._project_client = None
        self._twilio_client = None
        self.last_token_usage: Optional[Dict[str, int]] = None
        
        # Twilio configuration
        self.twilio_account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        self.twilio_from_number = os.environ.get("TWILIO_FROM_NUMBER")
        self.twilio_default_to_number = os.environ.get("TWILIO_DEFAULT_TO_NUMBER")
        
    def _get_client(self) -> AgentsClient:
        """Get a cached AgentsClient instance."""
        if self._agents_client is None:
            self._agents_client = AgentsClient(
                endpoint=self.endpoint,
                credential=self.credential,
            )
        return self._agents_client
        
    def _get_project_client(self) -> AIProjectClient:
        """Get a cached AIProjectClient instance."""
        if self._project_client is None:
            self._project_client = AIProjectClient(
                endpoint=self.endpoint,
                credential=self.credential,
            )
        return self._project_client
    
    def _get_twilio_client(self) -> TwilioClient:
        """Get a cached Twilio client instance."""
        if self._twilio_client is None:
            if not self.twilio_account_sid or not self.twilio_auth_token:
                raise ValueError("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN")
            self._twilio_client = TwilioClient(self.twilio_account_sid, self.twilio_auth_token)
        return self._twilio_client
    
    def _validate_twilio_config(self) -> bool:
        """Validate Twilio configuration."""
        missing = []
        if not self.twilio_account_sid:
            missing.append("TWILIO_ACCOUNT_SID")
        if not self.twilio_auth_token:
            missing.append("TWILIO_AUTH_TOKEN")
        if not self.twilio_from_number:
            missing.append("TWILIO_FROM_NUMBER")
        
        if missing:
            logger.error(f"Missing Twilio configuration: {', '.join(missing)}")
            return False
        return True
    
    def send_sms(self, message: str, to_number: Optional[str] = None) -> Dict:
        """
        Send an SMS message via Twilio.
        
        Args:
            message: The SMS message body
            to_number: Recipient phone number (uses default if not provided)
            
        Returns:
            Dict with success status and details
        """
        try:
            client = self._get_twilio_client()
            recipient = to_number or self.twilio_default_to_number
            
            if not recipient:
                return {
                    "success": False,
                    "error": "No recipient phone number provided and no default configured"
                }
            
            # Truncate message if too long for SMS (160 chars for single SMS)
            if len(message) > 1600:
                message = message[:1597] + "..."
                logger.warning("Message truncated to 1600 characters for SMS")
            
            msg = client.messages.create(
                body=message,
                from_=self.twilio_from_number,
                to=recipient
            )
            
            result = {
                "success": True,
                "message_sid": msg.sid,
                "from": self.twilio_from_number,
                "to": recipient,
                "status": msg.status,
                "body_length": len(message)
            }
            
            logger.info(f"✅ SMS sent successfully: SID={msg.sid}, To={recipient}")
            return result
            
        except TwilioRestException as e:
            logger.error(f"❌ Twilio API error: {e}")
            return {
                "success": False,
                "error": str(e),
                "error_code": e.code if hasattr(e, 'code') else None
            }
        except Exception as e:
            logger.error(f"❌ Unexpected error sending SMS: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_send_sms_tool_definition(self) -> Dict:
        """Get the function tool definition for send_sms."""
        return {
            "type": "function",
            "function": {
                "name": "send_sms",
                "description": """Send an SMS text message via Twilio to notify a user.
                
Use this function to:
- Send workflow results or summaries to a user's phone
- Deliver notifications or alerts via SMS
- Confirm completed actions with a text message

The message should be clear and concise since SMS has character limits.
If no phone number is provided, the default configured number will be used.""",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "The SMS message content to send. Should be concise and informative. Max ~1600 characters."
                        },
                        "to_number": {
                            "type": "string",
                            "description": "Optional recipient phone number in E.164 format (e.g., +15147715943). If not provided, uses the default configured number."
                        }
                    },
                    "required": ["message"],
                    "additionalProperties": False
                }
            }
        }
        
    async def create_agent(self) -> Agent:
        """Create the AI Foundry agent with SMS sending capabilities."""
        if self.agent:
            logger.info("Twilio SMS agent already exists, returning existing instance")
            return self.agent
        
        # Validate Twilio config before creating agent
        if not self._validate_twilio_config():
            raise ValueError("Twilio configuration is incomplete")
        
        tools = []
        
        # Add the send_sms function tool
        tools.append(self._get_send_sms_tool_definition())
        logger.info("Added send_sms function tool")
        
        project_client = self._get_project_client()
        
        with project_client:
            self.agent = project_client.agents.create_agent(
                model=os.getenv("AZURE_AI_AGENT_MODEL_DEPLOYMENT_NAME", "gpt-4o"),
                name="foundry-twilio-sms-agent",
                instructions=self._get_agent_instructions(),
                tools=tools
            )
        
        logger.info(f"✅ Created Twilio SMS agent: {self.agent.id}")
        return self.agent
    
    def _get_agent_instructions(self) -> str:
        """Get the agent instructions for SMS messaging."""
        return f"""You are an SMS notification agent powered by Azure AI Foundry and Twilio.

## Your Purpose
You send SMS text messages to users. You are typically used as the final step in a multi-agent workflow to deliver results, confirmations, or notifications to users' phones.

## Your Capabilities
You have ONE tool available:
- **send_sms**: Send an SMS message to a phone number

## How to Process Requests

1. **Analyze the incoming message**: Understand what content needs to be sent via SMS
2. **Compose a clear, concise SMS**: SMS messages should be brief and to the point
3. **Call the send_sms function**: Send the message to the user

## Message Formatting Guidelines

Since SMS has character limits (~160 chars per segment, max ~1600 chars total):
- Be concise and direct
- Remove unnecessary formatting (no markdown, headers, or bullets)
- Focus on the key information
- If the original content is long, summarize it appropriately

## Examples of Good SMS Messages

For a balance inquiry result:
"Your Stripe balance: $1,234.56 (Available: $1,000.00, Pending: $234.56). As of Feb 2, 2026."

For a workflow completion:
"Task completed! Your document has been processed and sent to the review team. Reference: #12345"

For an alert:
"ALERT: Unusual activity detected on your account. Please review your recent transactions."

## Response Format

After sending an SMS, provide a brief confirmation:
```
📱 SMS SENT SUCCESSFULLY

**To**: [phone number]
**Message**: [content preview]
**Status**: [delivered/queued]
**Message SID**: [Twilio message ID]
```

If the SMS fails, explain the error and suggest alternatives.

Current date and time: {datetime.datetime.now().isoformat()}

Remember: Your job is to SEND the SMS, not just describe what you would send. Always call the send_sms function!
"""

    async def create_thread(self, thread_id: Optional[str] = None) -> AgentThread:
        """Create or retrieve a conversation thread."""
        if thread_id and thread_id in self.threads:
            pass
            
        client = self._get_client()
        thread = client.threads.create()
        self.threads[thread.id] = thread.id
        logger.info(f"Created thread: {thread.id}")
        return thread
    
    async def send_message(self, thread_id: str, content: str, role: str = "user") -> ThreadMessage:
        """Send a message to the conversation thread."""
        client = self._get_client()
        message = client.messages.create(
            thread_id=thread_id,
            role=role,
            content=content
        )
        logger.info(f"Created message in thread {thread_id}: {message.id}")
        return message
    
    async def _handle_tool_calls(self, run: ThreadRun, thread_id: str):
        """Handle function tool calls from the agent."""
        client = self._get_client()
        
        if not hasattr(run, 'required_action') or not run.required_action:
            logger.warning("No required_action found in run")
            return
        
        if not hasattr(run.required_action, 'submit_tool_outputs'):
            logger.warning("No submit_tool_outputs in required_action")
            return
        
        tool_calls = run.required_action.submit_tool_outputs.tool_calls
        tool_outputs = []
        
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            logger.info(f"🔧 Executing function: {function_name} with args: {function_args}")
            
            if function_name == "send_sms":
                # Execute the send_sms function
                result = self.send_sms(
                    message=function_args.get("message", ""),
                    to_number=function_args.get("to_number")
                )
                tool_outputs.append(ToolOutput(
                    tool_call_id=tool_call.id,
                    output=json.dumps(result)
                ))
                logger.info(f"📱 SMS function result: {result}")
            else:
                # Unknown function
                tool_outputs.append(ToolOutput(
                    tool_call_id=tool_call.id,
                    output=json.dumps({"error": f"Unknown function: {function_name}"})
                ))
        
        # Submit tool outputs
        if tool_outputs:
            client.runs.submit_tool_outputs(
                thread_id=thread_id,
                run_id=run.id,
                tool_outputs=tool_outputs
            )
            logger.info(f"Submitted {len(tool_outputs)} tool outputs")
    
    async def run_conversation_stream(self, thread_id: str, user_message: str):
        """Async generator: yields progress messages and final response."""
        if not self.agent:
            await self.create_agent()

        await self.send_message(thread_id, user_message)
        client = self._get_client()
        run = client.runs.create(thread_id=thread_id, agent_id=self.agent.id)

        max_iterations = 25
        iterations = 0
        tool_calls_yielded = set()

        while run.status in ["queued", "in_progress", "requires_action"] and iterations < max_iterations:
            iterations += 1
            await asyncio.sleep(2)
            
            # Check for tool calls in progress
            try:
                run_steps = client.run_steps.list(thread_id, run.id)
                for run_step in run_steps:
                    if (hasattr(run_step, "step_details") and
                        hasattr(run_step.step_details, "type") and
                        run_step.step_details.type == "tool_calls" and
                        hasattr(run_step.step_details, "tool_calls")):
                        for tool_call in run_step.step_details.tool_calls:
                            if tool_call and hasattr(tool_call, "type"):
                                tool_type = tool_call.type
                                if tool_type not in tool_calls_yielded:
                                    if hasattr(tool_call, 'function') and hasattr(tool_call.function, 'name'):
                                        yield f"🛠️ Calling function: {tool_call.function.name}"
                                    else:
                                        yield f"🛠️ Executing tool: {tool_type}"
                                    tool_calls_yielded.add(tool_type)
            except Exception:
                pass

            try:
                run = client.runs.get(thread_id=thread_id, run_id=run.id)
            except Exception as e:
                yield f"Error: {str(e)}"
                return

            if run.status == "failed":
                yield f"Error: {run.last_error}"
                return

            if run.status == "requires_action":
                logger.info(f"Run {run.id} requires action")
                try:
                    await self._handle_tool_calls(run, thread_id)
                except Exception as e:
                    yield f"Error handling tool calls: {str(e)}"
                    return

        if run.status == "failed":
            yield f"Error: {run.last_error}"
            return

        if iterations >= max_iterations:
            yield "Error: Request timed out"
            return

        # Extract token usage
        if hasattr(run, 'usage') and run.usage:
            self.last_token_usage = {
                'prompt_tokens': getattr(run.usage, 'prompt_tokens', 0),
                'completion_tokens': getattr(run.usage, 'completion_tokens', 0),
                'total_tokens': getattr(run.usage, 'total_tokens', 0)
            }

        # Get the assistant's response
        messages = list(client.messages.list(thread_id=thread_id, order=ListSortOrder.ASCENDING))
        for msg in reversed(messages):
            if msg.role == "assistant" and msg.content:
                for content_item in msg.content:
                    if hasattr(content_item, 'text'):
                        yield content_item.text.value
                break

    async def cleanup(self):
        """Cleanup resources."""
        logger.info("Cleaning up Twilio SMS Agent")
        self._agents_client = None
        self._project_client = None
        self._twilio_client = None
        self.threads = {}
