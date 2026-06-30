# HiAPI GPT Image 2 API

## Endpoint

The GPT Image 2 family uses HiAPI's unified async task API:

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
  "model": "gpt-image-2/text-to-image",
  "input": {
    "prompt": "Create a cinematic product poster...",
    "aspect_ratio": "16:9",
    "resolution": "1K"
  }
}
```

Image-to-image:

```json
{
  "model": "gpt-image-2/image-to-image",
  "input": {
    "prompt": "Restyle this product photo as a premium studio ad",
    "input_urls": ["https://example.com/product.jpg"],
    "aspect_ratio": "16:9",
    "resolution": "2K"
  }
}
```

## Parameters

| Parameter | Required | Notes |
| --- | --- | --- |
| `model` | yes | `gpt-image-2/text-to-image` or `gpt-image-2/image-to-image`. |
| `input.prompt` | yes | Text image instruction. |
| `input.input_urls` | image-to-image only | Required for `gpt-image-2/image-to-image`; pass 1-5 public image URLs. Do not send it for the text-to-image model. |
| `input.aspect_ratio` | no | `auto`, `1:1`, `3:2`, `2:3`, `4:3`, `3:4`, `5:4`, `4:5`, `16:9`, `9:16`, `2:1`, `1:2`, `3:1`, `1:3`, `21:9`, or `9:21`. Defaults to `auto`. |
| `input.resolution` | no | `1K`, `2K`, or `4K`. Defaults to `1K`. |

The text-to-image model does not accept `input_urls`. The image-to-image model requires `input_urls`, and the CLI validates the 1-5 image limit before sending the task.

## Production Callbacks (optional)

For local debugging and the CLI flow, polling `GET /v1/tasks/{taskId}` until the task reaches a terminal state is fine. For production services, HiAPI recommends passing a top-level `callback.url` so HiAPI notifies your service when the task finishes instead of you polling:

```json
{
  "model": "gpt-image-2/text-to-image",
  "input": { "prompt": "...", "aspect_ratio": "16:9", "resolution": "1K" },
  "callback": { "url": "https://your-domain.com/hiapi/callback", "when": "final" }
}
```

- `callback.url` (required when `callback` is present): HTTPS URL that receives the terminal task notification.
- `callback.when` (default `final`): both `success` and `fail` are terminal, so deduplicate by `taskId`.

This CLI does not send `callback` itself; it is documented here for users wiring HiAPI into their own backend.

## Output Storage (optional, paid)

Every output is served from HiAPI's CDN as a `url`. **By default outputs are temporary and expire about 7 days after creation; downloads are always free.** If you want to keep specific outputs longer, opt into the persistent storage tier — this is billed:

- Pricing: `$0.05 / GB · month`, charged daily (UTC 00:30) against your HiAPI credit balance. Downloads (egress) stay free.
- Keep at creation: add top-level `"storage": "persistent"` to the Create Task body.
- Promote/list/delete later with `POST /v1/storages/promote`, `GET /v1/storages`, `POST /v1/storages/delete` (Bearer-authenticated, account-scoped). Deleting stops charges immediately; there is no demote.
- Default per-account cap is 100 GB; persistent writes past the cap silently fall back to temporary (generation still succeeds).

This skill downloads results locally (a free operation) and defaults to the temporary tier. Pass `--storage persistent` to opt into long-term billed storage (the CLI sends top-level `"storage": "persistent"` and prints a cost notice on stderr). Mention the cost before suggesting a user turn it on. See https://docs.hiapi.ai/storage/ for full details.
