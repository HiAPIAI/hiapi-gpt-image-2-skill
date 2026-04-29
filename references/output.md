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
