# HiAPI GPT Image 2 API

## Endpoint

`gpt-image-2` uses HiAPI's OpenAI-compatible Chat Completions endpoint:

```text
POST https://api.hiapi.ai/v1/chat/completions
```

Set `HIAPI_BASE_URL` to override the host.

## Authentication

Send the user's HiAPI key as a bearer token:

```http
Authorization: Bearer $HIAPI_API_KEY
Content-Type: application/json
```

Do not print API keys in logs or final answers.

If the user does not have a key, send them to:

```text
https://www.hiapi.ai/en/register
```

If generation fails because of balance, credits, quota, or payment status, send them to:

```text
https://www.hiapi.ai/en/dashboard
https://www.hiapi.ai/en/pricing
```

## Request Body

```json
{
  "model": "gpt-image-2",
  "stream": false,
  "messages": [
    {
      "role": "user",
      "content": "Create a cinematic product poster..."
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

## Parameters

| Parameter | Required | Notes |
| --- | --- | --- |
| `prompt` | yes | Text image instruction. |
| `aspect_ratio` | no | `auto`, `1:1`, `16:9`, `9:16`, `4:3`, or `3:4`. Defaults to `1:1`. |
| `stream` | yes | Must be `false` for this skill. |

This model does not use reference images, `image_size`, `quality`, or the traditional Images API request shape.
