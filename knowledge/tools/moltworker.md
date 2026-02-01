---
title: "Moltworker"
type: tool
date_added: 2026-02-01
source: "https://github.com/cloudflare/moltworker"
tags: ["ai-agents", "cloudflare-workers", "deployment", "openclaw", "personal-assistant"]
via: "Twitter bookmark from @CloudflareDev"
---

Moltworker is a proof-of-concept implementation that enables OpenClaw (formerly Moltbot/Clawdbot), a personal AI assistant, to run directly on Cloudflare Workers using the Sandbox SDK. This allows users to deploy a secure, fully-managed AI assistant without needing to self-host infrastructure.

## Key Features

- **Secure-by-default deployment** - Uses Cloudflare Sandbox SDK for sandboxed execution
- **No additional hardware required** - Runs entirely on Cloudflare Workers infrastructure
- **Multi-channel support** - Supports Telegram, Discord, Slack integration through OpenClaw's gateway
- **Persistent conversations** - Chat history and context maintained across sessions
- **Device pairing** - Secure authentication with explicit approval required
- **Optional R2 storage** - Enables persistence of paired devices and conversation history across container restarts
- **Cloudflare Access integration** - Built-in authentication and admin UI protection
- **Browser rendering support** - For web navigation capabilities
- **AI Gateway compatibility** - Optional API routing and analytics through Cloudflare's AI Gateway

## Architecture

The implementation packages OpenClaw in a Cloudflare Sandbox container, providing:
- Web-based control UI at the gateway
- Extensible agent runtime with workspace and skills
- Optional persistent storage layer via R2

## Requirements

- Cloudflare Workers Paid plan ($5 USD/month) - required for Sandbox containers
- Anthropic API key (for Claude access) or AI Gateway's Unified Billing
- Optional: R2 storage for conversation persistence

## Quick Start

```bash
npm install
npx wrangler secret put ANTHROPIC_API_KEY
export MOLTBOT_GATEWAY_TOKEN=$(openssl rand -hex 32)
npx wrangler secret put MOLTBOT_GATEWAY_TOKEN
npm run deploy
```

Access the Control UI at: `https://your-worker.workers.dev/?token=YOUR_GATEWAY_TOKEN`

## Links

- [GitHub Repository](https://github.com/cloudflare/moltworker)
- [Original Tweet](https://x.com/CloudflareDev/status/2016898230877847742)
- [OpenClaw Repository](https://github.com/openclaw/openclaw)
