# Twilio SMS Agent# AI Foundry Classification Triage Agent



A2A Remote Agent for sending SMS text messages via Twilio API.An Azure AI Foundry agent that classifies customer incidents and recommends routing/priority based on ServiceNow standards. It reuses the A2A framework so it can run locally alongside other agents and self-register with a host agent.



## Overview## Features

- 🧭 **Incident Classification** – Categorizes messages into Fraud, Technical Issues, Payment Issues, Card Issues, Account Services, Security, and Inquiries.

This agent sends SMS notifications via Twilio. It's designed to be used as the **final step in a workflow** to deliver results, summaries, or alerts to users' phones.- ⚡ **Priority Assessment** – Determines urgency/impact/priority using a ServiceNow-style matrix.

- 🚦 **Routing & Triage** – Recommends team assignment and escalation paths.

## Use Case- 🧩 **Field Mapping** – Maps details to ServiceNow fields (category, subcategory, short description, metadata).

- 🔎 **Keyword Analysis** – Extracts signals and context cues to improve classification.

In a multi-agent workflow:- 🌐 **Dual Operation Modes** – Run as an A2A server (default `8001`) or launch the Gradio UI (default `8089`) alongside it.

1. **Agent 1** (e.g., Stripe) → Gets account balance- 🤝 **Self-Registration** – Automatically registers with the Host Agent (`A2A_HOST`, defaults to `http://localhost:12000`).

2. **Agent 2** (e.g., Analysis) → Processes and summarizes data

3. **Twilio Agent** → Sends the final result via SMS to the user## Project Structure

```

The orchestrator passes the message content to the Twilio agent, which sends it as an SMS.├── foundry_agent.py           # Core Azure AI Foundry agent logic (classification/triage)

├── foundry_agent_executor.py  # A2A executor with streaming and shared-thread execution

## Skills├── __main__.py                # CLI entry point (A2A server + optional Gradio UI)

├── utils/self_registration.py # Host-agent self-registration helper

| Skill | Description |├── documents/                 # (optional) reference docs used by skills

|-------|-------------|├── static/                    # UI assets (e.g., a2a.png)

| **Send SMS Message** | Send an SMS text message to a phone number |└── pyproject.toml             # Dependencies

| **User Notification** | Notify a user via SMS with workflow results or updates |```



## Configuration## Quick Start

### 1) Environment Setup

Create a `.env` file with the following variables:```bash

# Set required Azure AI Foundry variables (in shell or a local .env)

```envexport AZURE_AI_FOUNDRY_PROJECT_ENDPOINT=your-project-endpoint

# Twilio Credentials (from https://console.twilio.com/)export AZURE_AI_AGENT_MODEL_DEPLOYMENT_NAME=your-model-deployment

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

TWILIO_AUTH_TOKEN=your_auth_token_here# Optional: A2A host for self-registration (host agent URL)

export A2A_HOST=http://localhost:12000

# Phone Numbers

TWILIO_FROM_NUMBER=+1234567890          # Your Twilio number# Optional: override bind/advertised endpoint

TWILIO_DEFAULT_TO_NUMBER=+1234567890    # Default recipientexport A2A_ENDPOINT=localhost    # hostname used in public URL

export A2A_PORT=8001             # A2A server port (defaults to 8001)

# A2A Configuration```

A2A_ENDPOINT=localhost

A2A_PORT=8015### 2) Install Dependencies

A2A_HOST=http://localhost:12000         # Host agent for registration```bash

```uv sync

```

## Running the Agent

### 3) Run the Agent

### Using uv (recommended)- **A2A server only** (serves on `http://$A2A_ENDPOINT:$A2A_PORT/`):

  ```bash

```bash  uv run .

cd remote_agents/azurefoundry_twilio  ```

uv sync  Health check: `http://$A2A_ENDPOINT:$A2A_PORT/health`

uv run python -m __main__

```- **Gradio UI + A2A server**

  ```bash

### Using pip  uv run . --ui

  ```

```bash  UI: `http://localhost:8089` (default)  |  A2A API: `http://localhost:8001/`

cd remote_agents/azurefoundry_twilio

pip install -e .- **Custom ports**

python -m __main__  ```bash

```  uv run . --ui --ui-port 8095 --port 8005

  ```

### Options

### 4) Verify Self-Registration (optional)

```bashWith the host agent running, start the classification agent and check for the new agent in the host’s Remote Agents list. You can also run a self-registration diagnostic from similar agents’ test utilities if needed.

python -m __main__ --help

## Sample Prompts

Options:- "There’s an unauthorized $500 charge on my account."

  --host TEXT     Host to bind to (default: localhost)- "I can’t log into the mobile banking app; it says invalid credentials."

  --port INTEGER  Port for A2A server (default: 8015)- "ATM dispensed no cash but charged my account $200."

```- "Please close my account and explain any fees."



## Message Formats## Troubleshooting

- Ensure `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT` and `AZURE_AI_AGENT_MODEL_DEPLOYMENT_NAME` are set.

The agent accepts messages in several formats:- Confirm the host agent is reachable at `A2A_HOST` for self-registration.

- If the UI doesn’t load, check that port `8089` is free (or set `--ui-port`).

### Simple message (uses default phone number)- If the A2A server fails to bind, ensure port `8001` is free (or set `A2A_PORT` / `--port`).

```

Your account balance is $1,234.56## Default Ports & Environment Overrides

```- A2A Server: `A2A_ENDPOINT:A2A_PORT` (defaults to `localhost:8001`, override via env or `--port`)

- Gradio UI: `8089` (override with `--ui-port`)

### With explicit phone number- Host Agent URL: `A2A_HOST` (defaults to `http://localhost:12000`, accepts empty string to disable)

```

Send to +15147715943: Your account balance is $1,234.56Happy triaging! 🗂️

```

### From workflow context
The orchestrator typically sends messages like:
```
Send the following summary via SMS: Your Stripe balance is $1,234.56 as of Feb 2, 2026.
```

## Example Workflow

```yaml
workflow:
  name: "Balance Check with SMS Notification"
  agents:
    - name: stripe
      task: "Get current account balance"
    - name: twilio
      task: "Send SMS with the balance: {{stripe.response}}"
```

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

### "No recipient phone number provided"
Set `TWILIO_DEFAULT_TO_NUMBER` in your `.env` file, or include the phone number in your message.

### "Authentication Error"
Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct.

### "Cannot send to unverified number" (Trial accounts)
Verify the recipient number in the Twilio console.
