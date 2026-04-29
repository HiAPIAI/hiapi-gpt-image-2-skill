# Agent Install Notes

This file is for AI agents installing or using the HiAPI GPT Image 2 skill.

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
3. Use `scripts/hiapi-gpt-image-2.mjs`.
4. Return the generated file path or remote URL.
5. If generation fails, return the HTTP status and compact error message.

Do not fabricate image paths or URLs.
