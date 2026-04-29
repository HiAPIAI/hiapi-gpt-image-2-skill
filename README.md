# HiAPI GPT Image 2 Skill

HiAPI GPT Image 2 Skill lets skill-capable agents generate images with `gpt-image-2` through the HiAPI OpenAI-compatible API.

This repository is intentionally focused on one model first: `gpt-image-2`. Broader HiAPI multi-model skills can be built later without making this single-model skill harder to understand.

[HiAPI](https://www.hiapi.ai) · [API Keys](https://www.hiapi.ai/en/dashboard/api-keys) · [Docs](https://docs.hiapi.ai) · [Agent install notes](llms-install.md)

## What This Is

| Item | Value |
| --- | --- |
| Skill name | `hiapi-gpt-image-2` |
| Model | `gpt-image-2` |
| Provider path | HiAPI |
| API endpoint | `POST /v1/chat/completions` |
| Main use | Text-to-image generation |
| Output | Saved image files or returned image URLs |
| Runtime | Node.js 18+ |

This skill is for agents such as Codex, Claude Code, OpenCode, Cursor-style agent runtimes, and other tools that can load local skill folders.

## Features

- Generate images through HiAPI `gpt-image-2`.
- Use natural language prompts from an AI agent.
- Control output aspect ratio: `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4`.
- Save `data:image/...;base64,...` results into the local `outputs/` folder.
- Return remote image URLs when the API response contains URL-based Markdown images.
- Validate local configuration before making live requests.
- Keep API details in a compact `SKILL.md` plus references for agent use.

## What It Does Not Do Yet

- It does not support image editing or reference images.
- It does not route across all HiAPI models.
- It does not use the traditional `/v1/images/generations` request shape.
- It does not include a hosted installer package yet.

Those are deliberate scope limits for the first public version.

## Quick Install For Codex

Clone the repository:

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test
```

Install the skill into Codex:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

Restart Codex so the new `$hiapi-gpt-image-2` skill is loaded.

## Manual Install For Other Agents

Copy or symlink this repository into your agent runtime's skill directory:

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
export AGENT_SKILLS_DIR="/path/to/your/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
ln -s "$PWD/hiapi-gpt-image-2-skill" "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

If your agent does not support symlinks, copy the folder instead.

## Configure HiAPI

Create or copy a HiAPI API key from:

```text
https://www.hiapi.ai/en/dashboard/api-keys
```

Set environment variables:

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
```

`HIAPI_BASE_URL` is optional. The default is `https://api.hiapi.ai`.

Check local configuration:

```bash
node scripts/check-config.mjs
```

Run a live connectivity check:

```bash
node scripts/check-config.mjs --live
```

## Use With An Agent

After installation, ask your agent:

```text
Use $hiapi-gpt-image-2 to generate a 16:9 product launch poster for an AI writing app.
```

More examples:

```text
Use HiAPI GPT Image 2 to create a clean 1:1 app icon concept for a developer tool.
```

```text
Generate a 9:16 social media poster with GPT Image 2 through HiAPI. The headline text should be "Build Faster".
```

```text
Create a 4:3 editorial illustration of a compact AI dashboard in a quiet operations room.
```

The agent should read `SKILL.md`, call the bundled script, and return the saved image path or URL.

## CLI Usage

Basic generation:

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Create a cinematic mountain lake photo at sunset" \
  --aspect-ratio 16:9
```

Save into a custom output directory:

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Minimal poster for an AI image API, premium tech brand style" \
  --aspect-ratio 1:1 \
  --output-dir ./outputs
```

The CLI prints JSON:

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

Expected response shape:

```text
choices[0].message.content
```

The content commonly contains Markdown image data:

```text
![image](data:image/png;base64,...)
```

## File Structure

```text
.
├── README.md
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
├── .env.example
└── package.json
```

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `HIAPI_API_KEY is required.` | Export `HIAPI_API_KEY` in the shell running your agent. |
| `401 Unauthorized` | Check that the HiAPI API key is valid and copied completely. |
| `429 Too Many Requests` | Wait and retry, or reduce concurrent requests. |
| `Unsupported aspect ratio` | Use `auto`, `1:1`, `16:9`, `9:16`, `4:3`, or `3:4`. |
| No image extracted | Inspect the raw API response. The skill expects Markdown image content in `choices[0].message.content`. |
| Agent cannot find the skill | Restart the agent after copying the folder into the skill directory. |

## Development

Run tests:

```bash
npm test
```

Validate the skill file:

```bash
python3 /path/to/quick_validate.py .
```

Syntax check scripts:

```bash
node --check scripts/hiapi-gpt-image-2.mjs
node --check scripts/check-config.mjs
node --check scripts/lib/gpt-image-2.mjs
```

## License

MIT
