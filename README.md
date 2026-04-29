<div align="center">

# HiAPI GPT Image 2 Skill

Generate images with OpenAI `gpt-image-2` through HiAPI, directly from AI agents.

[![Skill](https://img.shields.io/badge/Skill-hiapi--gpt--image--2-10A37F)](SKILL.md)
[![Model](https://img.shields.io/badge/Model-gpt--image--2-blue)](https://www.hiapi.ai)
[![Runtime](https://img.shields.io/badge/Node.js-18%2B-339933)](package.json)
[![License](https://img.shields.io/badge/License-MIT-black)](LICENSE)

[Get API Key](https://www.hiapi.ai/en/dashboard/api-keys) ·
[Add Credits](https://www.hiapi.ai/en/dashboard) ·
[Pricing](https://www.hiapi.ai/en/pricing) ·
[Docs](https://docs.hiapi.ai) ·
[AI Agent Notes](llms-install.md)

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

</div>

---

## Agent Quick Start

If you are an AI agent reading this repository, do this:

```text
1. Read SKILL.md.
2. Check HIAPI_API_KEY.
3. If missing, send the user to https://www.hiapi.ai/en/dashboard/api-keys.
4. Run scripts/hiapi-gpt-image-2.mjs with the user's prompt.
5. Return the generated image path or URL.
6. If balance/credits/quota/HTTP 402 appears, send the user to https://www.hiapi.ai/en/dashboard.
7. Never fabricate image paths, URLs, or success messages.
```

Copy-ready prompt:

```text
Use $hiapi-gpt-image-2 to generate a 16:9 launch poster through HiAPI. If my API key or balance is missing, tell me exactly where to configure it.
```

---

## Choose Your Path

| I want to... | Start here | Result |
| --- | --- | --- |
| Use the skill in Codex | [Install into Codex](#install-into-codex) | `$hiapi-gpt-image-2` becomes available after restart |
| Generate from terminal | [CLI usage](#cli-usage) | Image files saved under `outputs/` |
| Configure HiAPI | [API key setup](#api-key-setup) | `HIAPI_API_KEY` is ready for agents |
| Fix an error | [Error guide](#error-guide) | Clear next action for key, balance, rate limit, or safety issues |
| Let another agent install it | [AI Agent Notes](llms-install.md) | Agent-readable installation instructions |

---

## What This Skill Does

| Area | Details |
| --- | --- |
| Skill name | `hiapi-gpt-image-2` |
| Model | `gpt-image-2` |
| Provider | [HiAPI](https://www.hiapi.ai) |
| Endpoint | `POST /v1/chat/completions` |
| Use case | Text-to-image generation |
| Aspect ratios | `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| Output | Local image files or remote image URLs |
| Runtime | Node.js 18+ |

Why it is useful:

- Focused on one model, so there is no routing ambiguity.
- Gives agents exact instructions instead of making them infer API details.
- Sends users to HiAPI when they need an API key, credits, pricing, or documentation.
- Handles common failure states with actionable messages.
- Saves base64 image results as local files automatically.

---

## Install Into Codex

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test

mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

Restart Codex after copying the skill.

For another agent runtime:

```bash
export AGENT_SKILLS_DIR="/path/to/your/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
ln -s "$PWD" "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

---

## API Key Setup

1. Create or copy a key from [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys).
2. Export it in the shell that runs your agent:

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
```

3. Check configuration:

```bash
node scripts/check-config.mjs
```

4. Optional live check:

```bash
node scripts/check-config.mjs --live
```

`HIAPI_BASE_URL` is optional. The default is `https://api.hiapi.ai`.

---

## Use With An Agent

```text
Use $hiapi-gpt-image-2 to generate a 16:9 product launch poster for an AI writing app.
```

```text
Use HiAPI GPT Image 2 to create a clean 1:1 app icon concept for a developer tool.
```

```text
Generate a 9:16 social media poster with GPT Image 2 through HiAPI. The headline text should be "Build Faster".
```

```text
Create a 4:3 editorial illustration of a compact AI dashboard in a quiet operations room.
```

---

## CLI Usage

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Create a cinematic mountain lake photo at sunset" \
  --aspect-ratio 16:9
```

Custom output directory:

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Minimal poster for an AI image API, premium tech brand style" \
  --aspect-ratio 1:1 \
  --output-dir ./outputs
```

Output shape:

```json
{
  "model": "gpt-image-2",
  "aspectRatio": "16:9",
  "outputs": [
    {
      "kind": "file",
      "path": "/absolute/path/to/outputs/gpt-image-2-20260429-154500-1.png",
      "mimeType": "image/png"
    }
  ]
}
```

---

## Error Guide

| Error | Next action |
| --- | --- |
| `HIAPI_API_KEY is required` | Create a key at [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys), then export `HIAPI_API_KEY`. |
| `HTTP 401` or `HTTP 403` | Check that the key is valid, active, and copied completely. |
| `HTTP 402`, insufficient balance, credits, quota | Add credits or check billing in the [HiAPI dashboard](https://www.hiapi.ai/en/dashboard). See [pricing](https://www.hiapi.ai/en/pricing). |
| `HTTP 429` | Wait and retry, or reduce concurrent generation requests. |
| Content policy or safety error | Revise the prompt and try again. |
| No image extracted | The skill expects Markdown image output in `choices[0].message.content`; inspect the raw response. |

---

<details>
<summary><strong>API Contract</strong></summary>

The skill calls HiAPI's OpenAI-compatible Chat Completions endpoint:

```http
POST https://api.hiapi.ai/v1/chat/completions
Authorization: Bearer $HIAPI_API_KEY
Content-Type: application/json
```

Request body:

```json
{
  "model": "gpt-image-2",
  "stream": false,
  "messages": [
    {
      "role": "user",
      "content": "Create a launch poster for an AI note-taking app"
    }
  ],
  "extra_body": {
    "google": {
      "image_config": {
        "aspect_ratio": "16:9"
      }
    }
  }
}
```

Expected image content:

```text
choices[0].message.content
```

Common output:

```text
![image](data:image/png;base64,...)
```

</details>

<details>
<summary><strong>Project Structure</strong></summary>

```text
.
├── README.md
├── README.zh-CN.md
├── README.ja.md
├── README.ko.md
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── api.md
│   └── output.md
├── scripts/
│   ├── check-config.mjs
│   ├── hiapi-gpt-image-2.mjs
│   └── lib/
│       └── gpt-image-2.mjs
├── tests/
│   └── gpt-image-2.test.mjs
├── llms-install.md
└── package.json
```

</details>

<details>
<summary><strong>Related HiAPI Options</strong></summary>

Use this skill when you specifically want `gpt-image-2` text-to-image generation through HiAPI.

For HiAPI image editing, video generation, and other image/video models, use [HiAPI MCP](https://docs.hiapi.ai) or the model-specific HiAPI API documentation.

</details>

---

## Development

```bash
npm test
node --check scripts/hiapi-gpt-image-2.mjs
node --check scripts/check-config.mjs
node --check scripts/lib/gpt-image-2.mjs
```

## License

MIT
