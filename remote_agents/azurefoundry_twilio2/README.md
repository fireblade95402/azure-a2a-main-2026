# Twilio SMS Agent

A2A Remote Agent for sending SMS text messages via Twilio, powered by Azure AI Foundry.

## Overview

This agent uses **Azure AI Foundry** with **function calling** to send SMS messages via the Twilio API. It's designed to be used as the **final step in a workflow** to deliver results, summaries, or alerts to users' phones.

## Architecture

```
User Request → Host Orchestrator → Previous Agents → Twilio SMS Agent → SMS to User
```

The agent:
1. Receives a message from the orchestrator (e.g., "Send this summary: Your balance is $1,234.56")
2. Uses Azure AI Foundry with GPT-4o to process the request
3. Calls the `send_sms` function to deliver the message via Twilio
4. Returns confirmation of successful delivery

## Skills

| Skill | Description |
|-------|-------------|
| **Send SMS Message** | Send an SMS text message to a phone number via Twilio |
| **User Notification** | Notify a user via SMS with workflow results or updates |

## Configuration

Create a `.env` file with the following variables:

```env
# Azure AI Foundry Configuration
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT="https://your-project.services.ai.azure.com/api/projects/proj-default"
AZURE_AI_AGENT_MODEL_DEPLOYMENT_NAME="gpt-4o"

# Twilio Credentials (from https://console.twilio.com/)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Phone Numbers
TWILIO_FROM_NUMBER=+1234567890          # Your Twilio number
TWILIO_DEFAULT_TO_NUMBER=+1234567890    # Default recipient

# A2A Configuration
A2A_ENDPOINT=localhost
A2A_PORT=8016
A2A_HOST=http://localhost:12000         # Host agent for registration
```

## Running the Agent

### Using uv (recommended)

```bash
cd remote_agents/azurefoundry_twilio2
uv sync
uv run python -m __main__
```

### Using pip

```bash
cd remote_agents/azurefoundry_twilio2
pip install -e .
python -m __main__
```

### Options

```bash
python -m __main__ --help

Options:
  --host TEXT     Host to bind to (default: localhost)
  --port INTEGER  Port for A2A server (default: 8016)
```

## Function Tool

The agent has one function tool available:

### `send_sms`

Sends an SMS message via Twilio.

**Parameters:**
- `message` (required): The SMS message content
- `to_number` (optional): Recipient phone number in E.164 format (e.g., +15147715943)

## Example Workflow Usage

In a multi-agent workflow:

```yaml
workflow:
  name: "Balance Check with SMS Notification"
  agents:
    - name: stripe
      task: "Get current account balance"
    - name: twilio
      task: "Send the balance summary via SMS"
```

The orchestrator will:
1. Call the Stripe agent to get the balance
2. Call the Twilio agent with: "Send SMS: Your Stripe balance is $1,234.56"
3. The Twilio agent sends the SMS and confirms delivery

## API Endpoints

- `GET /health` - Health check
- `POST /` - A2A task endpoint
- `GET /.well-known/agent.json` - Agent card

## Trial Account Limitations

If using a Twilio trial account:
- Can only send SMS to **verified phone numbers**
- Messages are prefixed with "Sent from your Twilio trial account"
- Verify numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

## Troubleshooting

### "Missing required environment variables"
Ensure all required variables are set in your `.env` file.

### "Twilio credentials not configured"
Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct.

### "Cannot send to unverified number" (Trial accounts)
Verify the recipient number in the Twilio console.

### "Rate limit exceeded"
Your Azure AI Foundry deployment needs at least 20,000 TPM allocated.
