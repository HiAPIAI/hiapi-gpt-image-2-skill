# GPT Image 2 Image Generation Skill

Add GPT Image 2 image generation to your AI Agent.

**GPT Image 2 • Install • API Key • [HiAPI](https://www.hiapi.ai)**

[Get API Key](https://www.hiapi.ai/en/register) · [Pricing](https://www.hiapi.ai/en/pricing) · [HiAPI Docs](https://docs.hiapi.ai)

Languages: [English](README.md) | [简体中文](README.zh-CN.md)

---

> AI Agent? Skip the README and read [llms-install.md](llms-install.md). It contains installation steps and error-handling rules written for agents.

---

## What Is This?

An AI skill for OpenClaw / Claude Code / OpenCode / Codex-style agents. After installation, your AI Agent can use GPT Image 2 for image generation through HiAPI.

HiAPI is an AI API platform built for developers: one API for all AI models. Images, video, music, and text with one key.

| Skill | Description | Model |
| --- | --- | --- |
| HiAPI GPT Image 2 | Text-to-image generation | GPT Image 2 |

---

## Install

### Quick Install (OpenClaw)

```bash
openclaw skills add https://github.com/HiAPIAI/hiapi-gpt-image-2-skill
```

### Install Into Codex

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test

mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

Restart Codex after copying the skill.

### Manual Install For Any Agent

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
export AGENT_SKILLS_DIR="/path/to/your/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
cp -R hiapi-gpt-image-2-skill "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

Replace `AGENT_SKILLS_DIR` with your agent's skill directory.

### Agent Auto-Install Prompt

```text
Install the HiAPI GPT Image 2 image generation skill:

1. Clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill
2. Copy the repository into your skill directory as hiapi-gpt-image-2
3. Set the HIAPI_API_KEY environment variable
4. Read SKILL.md for usage
```

---

## Get API Key

1. Open [Get API Key](https://www.hiapi.ai/en/register)
2. Sign in or create a HiAPI account
3. Create a new API Key
4. Set the environment variable in the terminal that runs your agent:

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
```

Check configuration:

```bash
node scripts/check-config.mjs
```

Live check:

```bash
node scripts/check-config.mjs --live
```

---

## GPT Image 2 Image Generation

Ask your AI Agent to generate images with natural language.

### Features

- Text-to-image: describe the image you want and generate it
- Aspect ratios: `auto`, `1:1`, `16:9`, `9:16`, `4:3`, `3:4`
- Local output: images are saved to `outputs/`
- URL output: if HiAPI returns an image URL, the Agent returns the URL directly
- Clear errors: missing Key, invalid Key, insufficient balance, rate limits, and safety policy blocks all include a next step

### Examples

Talk directly to your AI Agent:

> Use `$hiapi-gpt-image-2` to generate a 16:9 image of a sunset over the sea.

> Use HiAPI GPT Image 2 to create a minimal logo, aspect ratio 1:1.

> Generate a 9:16 social media poster with the headline text "Build Faster".

### CLI Script

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

---

## File Structure

```text
.
├── README.md
├── README.zh-CN.md
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
└── llms-install.md
```

---

## FAQ

| Problem | Solution |
| --- | --- |
| `HIAPI_API_KEY is required` | Create a Key at [Get API Key](https://www.hiapi.ai/en/register), then set `HIAPI_API_KEY`. |
| `401 Unauthorized` | Check whether the API Key is correct, or generate a new Key. |
| `402 Payment Required` / insufficient balance | Open the [HiAPI Dashboard](https://www.hiapi.ai/en/dashboard) and check your account status. |
| `429 Too Many Requests` | Wait and retry, or reduce concurrent generation requests. |
| Content blocked | The prompt triggered a safety policy. Revise the description. |
| No image output | Check the API response; this skill expects an image in `choices[0].message.content`. |

---

## Compatibility

| Agent | Install Method |
| --- | --- |
| OpenClaw | `openclaw skills add https://github.com/HiAPIAI/hiapi-gpt-image-2-skill` |
| Codex | Copy to `${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2` |
| Claude Code | Copy to `~/.claude/skills/hiapi-gpt-image-2` |
| OpenCode | Copy to `~/.opencode/skills/hiapi-gpt-image-2` |
| Cursor / other agents | Copy to the corresponding skill directory |

---

## License

MIT

---

[HiAPI](https://www.hiapi.ai) — One API, all AI models
