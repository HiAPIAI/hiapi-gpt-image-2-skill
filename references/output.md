# Output Handling

HiAPI `gpt-image-2` returns image content through:

```text
choices[0].message.content
```

Common output:

```text
![image](data:image/png;base64,...)
```

The CLI extracts all Markdown image targets from the assistant message:

- `data:image/...;base64,...` values are saved under `outputs/`.
- `https://...` values are returned as URLs.

The CLI prints JSON:

```json
{
  "model": "gpt-image-2",
  "aspectRatio": "16:9",
  "outputs": [
    {
      "kind": "file",
      "path": "/absolute/path/to/outputs/gpt-image-2-20260429-154500-1.png"
    }
  ]
}
```

If no image can be extracted, treat the run as failed and show the returned content summary.

## User-Facing Failure Copy

- Missing key: "Set `HIAPI_API_KEY` first. You can create a key at https://www.hiapi.ai/en/register."
- Invalid key: "HiAPI rejected the API key. Check or regenerate it at https://www.hiapi.ai/en/register."
- Insufficient balance: "Your HiAPI balance or credits may be insufficient. Add credits or check billing at https://www.hiapi.ai/en/dashboard."
- Rate limited: "The request was rate limited. Wait and retry, or reduce concurrent image requests."
- Safety policy: "The prompt may have triggered a safety policy. Revise the prompt and try again."
