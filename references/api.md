# HiAPI GPT Image 2 API

## Endpoint

`gpt-image-2` uses HiAPI's unified async task API:

```text
POST https://api.hiapi.ai/v1/tasks
GET https://api.hiapi.ai/v1/tasks/{taskId}
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
  "input": {
    "prompt": "Create a cinematic product poster...",
    "aspect_ratio": "16:9",
    "resolution": "1K"
  }
}
```

## Parameters

| Parameter | Required | Notes |
| --- | --- | --- |
| `model` | yes | Must be `gpt-image-2`. |
| `input.prompt` | yes | Text image instruction. |
| `input.aspect_ratio` | no | `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `16:9`, `9:16`, `2:1`, `1:2`, `3:1`, `1:3`, `21:9`, or `9:21`. Defaults to `1:1`. |
| `input.resolution` | no | `1K`, `2K`, or `4K`. Defaults to `1K`. |

This text-to-image skill does not send reference images. Use a GPT Image 2 image-to-image model or another image-editing skill when the user provides source images.
