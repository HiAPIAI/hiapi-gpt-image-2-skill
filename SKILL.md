---
name: hiapi-gpt-image-2
description: Generate images with HiAPI's gpt-image-2 model via the HiAPI OpenAI-compatible Chat Completions endpoint. Use when a user asks to create an image with GPT Image 2, HiAPI GPT Image 2, or this specific skill.
metadata:
  short-description: Generate GPT Image 2 images through HiAPI
---

# HiAPI GPT Image 2

Use this skill when the user wants image generation through HiAPI's `gpt-image-2` model.

## Requirements

- Node.js 18 or newer.
- `HIAPI_API_KEY` must be set in the environment.
- `HIAPI_BASE_URL` is optional and defaults to `https://api.hiapi.ai`.

Never invent an image result. If the API call fails, report the status code and the compact error message.

## Generate An Image

Run:

```bash
node scripts/hiapi-gpt-image-2.mjs --prompt "Create a launch poster for an AI note app" --aspect-ratio 16:9
```

Supported aspect ratios:

- `auto`
- `1:1`
- `16:9`
- `9:16`
- `4:3`
- `3:4`

The script writes generated data URI images to `outputs/` and prints JSON with the saved file paths or remote URLs.

## API Contract

This skill calls:

```text
POST /v1/chat/completions
```

with:

```json
{
  "model": "gpt-image-2",
  "stream": false,
  "messages": [{ "role": "user", "content": "..." }],
  "extra_body": {
    "google": {
      "image_config": { "aspect_ratio": "16:9" }
    }
  }
}
```

Expected image output is Markdown image content in `choices[0].message.content`, commonly:

```text
![image](data:image/png;base64,...)
```

For details, read `references/api.md` and `references/output.md`.

## Check Configuration

Run:

```bash
node scripts/check-config.mjs
```

Use `--live` only when you want to verify that the configured key can reach the HiAPI pricing endpoint.
