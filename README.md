# HiAPI GPT Image 2 Skill

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Generate images with OpenAI `gpt-image-2` through [HiAPI](https://www.hiapi.ai), using a skill that AI agents can read, install, and run directly.

[Get API Key](https://www.hiapi.ai/en/dashboard/api-keys) · [Add Credits](https://www.hiapi.ai/en/dashboard) · [Pricing](https://www.hiapi.ai/en/pricing) · [HiAPI Docs](https://docs.hiapi.ai) · [AI agent notes](llms-install.md)

## For AI Agents

If you are an AI agent reading this repository:

1. Read [`SKILL.md`](SKILL.md).
2. Check that `HIAPI_API_KEY` is configured.
3. If no key is configured, send the user to [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys).
4. Run `node scripts/hiapi-gpt-image-2.mjs --prompt "..." --aspect-ratio 16:9`.
5. Return the saved image path or remote image URL.
6. If the API says balance, credits, quota, or HTTP `402`, send the user to the [HiAPI dashboard](https://www.hiapi.ai/en/dashboard) and [pricing page](https://www.hiapi.ai/en/pricing).
7. Never fabricate generated image paths, URLs, or success messages.

Copy-ready agent prompt:

```text
Use $hiapi-gpt-image-2 to generate a 16:9 launch poster through HiAPI. If my API key or balance is missing, tell me exactly where to configure it.
```

## Why Use This Skill

This repository turns HiAPI's `gpt-image-2` model into a practical agent skill:

- Clear install path for Codex, Claude Code, Cursor-style agents, and local agent runtimes.
- One focused model: `gpt-image-2`, no confusing model router yet.
- HiAPI API key flow built into the README and error messages.
- Helpful failure guidance for missing API keys, invalid keys, insufficient balance, rate limits, and content policy errors.
- Local output handling: base64 images are saved under `outputs/`; URL images are returned as URLs.

## What This Skill Uses

| Item | Value |
| --- | --- |
| Skill name | `hiapi-gpt-image-2` |
| Model | `gpt-image-2` |
| Provider path | HiAPI |
| Endpoint | `POST /v1/chat/completions` |
| Main use | Text-to-image generation |
| Output | Saved image files or remote image URLs |
| Runtime | Node.js 18+ |

## Install

Clone the skill:

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test
```

Install into Codex:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

Restart Codex after copying the skill.

For other agent runtimes, copy or symlink this folder into the runtime's skill directory:

```bash
export AGENT_SKILLS_DIR="/path/to/your/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
ln -s "$PWD" "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

## Configure HiAPI

Create an API key:

```text
https://www.hiapi.ai/en/dashboard/api-keys
```

Set your environment:

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
```

`HIAPI_BASE_URL` is optional. The default is `https://api.hiapi.ai`.

Check local configuration:

```bash
node scripts/check-config.mjs
```

Live check:

```bash
node scripts/check-config.mjs --live
```

## Use With An Agent

Examples:

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

## CLI Usage

Basic generation:

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

Output:

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

## Supported Options

| Option | Values |
| --- | --- |
| `--prompt` | Any non-empty image prompt |
| `--aspect-ratio` | `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| `--output-dir` | Local directory for generated files |

## Error Guidance

| Error | What To Do |
| --- | --- |
| `HIAPI_API_KEY is required` | Create a key at [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys), then export `HIAPI_API_KEY`. |
| `HTTP 401` or `HTTP 403` | Check that the key is valid, active, and copied completely. |
| `HTTP 402`, insufficient balance, credits, quota | Add credits or check billing in the [HiAPI dashboard](https://www.hiapi.ai/en/dashboard). See [pricing](https://www.hiapi.ai/en/pricing). |
| `HTTP 429` | Wait and retry, or reduce concurrent generation requests. |
| Content policy or safety error | Revise the prompt and try again. |
| No image extracted | The skill expects Markdown image output in `choices[0].message.content`; inspect the raw response. |

## API Contract

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

## Project Structure

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

## Current Scope

This first version is intentionally focused:

- Text-to-image only.
- `gpt-image-2` only.
- No image editing or reference image input yet.
- No multi-model routing yet.

For all HiAPI image and video models, use [HiAPI MCP](https://docs.hiapi.ai) or wait for a broader multi-model HiAPI skill.

## Development

```bash
npm test
node --check scripts/hiapi-gpt-image-2.mjs
node --check scripts/check-config.mjs
node --check scripts/lib/gpt-image-2.mjs
```

## License

MIT
