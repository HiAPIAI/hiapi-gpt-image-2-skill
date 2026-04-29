# HiAPI GPT Image 2 Skill - AI Agent Notes

This file is intentionally written for AI agents. Read it before installing or using this skill.

Important links:

- Get API key: https://www.hiapi.ai/zh/register
- Add credits or check account: https://www.hiapi.ai/en/dashboard
- Pricing: https://www.hiapi.ai/zh/pricing
- HiAPI docs: https://docs.hiapi.ai

## Purpose

Install `hiapi-gpt-image-2`, a single-model image generation skill for HiAPI `gpt-image-2`.

## Requirements

- Node.js 18 or newer.
- `HIAPI_API_KEY` in the environment.
- Optional `HIAPI_BASE_URL`; default is `https://api.hiapi.ai`.

## Install Into Codex

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R hiapi-gpt-image-2-skill "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

Restart Codex after installation.

## Install Into A Generic Agent Runtime

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
export AGENT_SKILLS_DIR="/path/to/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
cp -R hiapi-gpt-image-2-skill "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

## Configure

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
```

Check:

```bash
node scripts/check-config.mjs
```

## Generate

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Create a 16:9 launch poster for an AI writing app" \
  --aspect-ratio 16:9
```

## Agent Behavior

When this skill is used:

1. Read `SKILL.md`.
2. Ensure `HIAPI_API_KEY` is configured.
3. If the key is missing, tell the user to create one at https://www.hiapi.ai/zh/register.
4. Use `scripts/hiapi-gpt-image-2.mjs`.
5. Return the generated file path or remote URL.
6. If generation fails, return the HTTP status and compact error message.
7. If the error mentions balance, credits, quota, or HTTP 402, tell the user to add credits or check billing at https://www.hiapi.ai/en/dashboard.
8. If the error is HTTP 429, tell the user to wait and retry.
9. If the error mentions content policy or safety, ask the user to revise the prompt.

Do not fabricate image paths or URLs.
