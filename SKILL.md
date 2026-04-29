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

Important links:

- Get API key: https://www.hiapi.ai/en/dashboard/api-keys
- Add credits or check account: https://www.hiapi.ai/en/dashboard
- Pricing: https://www.hiapi.ai/en/pricing
- Docs: https://docs.hiapi.ai

Never invent an image result. If the API call fails, report the status code, compact error message, and the next action from the Error Guidance section.

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

## Error Guidance

- Missing `HIAPI_API_KEY`: tell the user to create or copy a key from https://www.hiapi.ai/en/dashboard/api-keys and export it.
- HTTP `401` or `403`: tell the user to verify the HiAPI API key.
- HTTP `402`, insufficient balance, credits, quota, or payment errors: tell the user to add credits or check billing at https://www.hiapi.ai/en/dashboard and review pricing at https://www.hiapi.ai/en/pricing.
- HTTP `429`: tell the user to wait and retry or reduce concurrent image generations.
- Content policy or safety errors: ask the user to revise the prompt.
- No extractable image: explain that this skill expects Markdown image content in `choices[0].message.content`.
