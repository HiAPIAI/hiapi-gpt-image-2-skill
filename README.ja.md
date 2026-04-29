# HiAPI GPT Image 2 Skill

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[HiAPI](https://www.hiapi.ai) 経由で OpenAI `gpt-image-2` の画像生成を使うための、AI エージェント向け skill です。

[API Key を取得](https://www.hiapi.ai/en/dashboard/api-keys) · [クレジット確認](https://www.hiapi.ai/en/dashboard) · [料金](https://www.hiapi.ai/en/pricing) · [Docs](https://docs.hiapi.ai) · [AI agent notes](llms-install.md)

## AI エージェント向け

1. [`SKILL.md`](SKILL.md) を読む。
2. `HIAPI_API_KEY` が設定されているか確認する。
3. 未設定なら [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys) に案内する。
4. `node scripts/hiapi-gpt-image-2.mjs --prompt "..." --aspect-ratio 16:9` を実行する。
5. 生成されたローカルファイルパス、または画像 URL を返す。
6. 残高不足、credits、quota、HTTP `402` が出たら [HiAPI dashboard](https://www.hiapi.ai/en/dashboard) と [pricing](https://www.hiapi.ai/en/pricing) に案内する。
7. 画像パスや URL を作り話で返さない。

## Install

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test
```

Codex:

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

## Configure

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
node scripts/check-config.mjs
```

## Use

```text
Use $hiapi-gpt-image-2 to generate a 16:9 product launch poster through HiAPI.
```

CLI:

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Create a cinematic product poster for an AI writing app" \
  --aspect-ratio 16:9
```

## Troubleshooting

| Error | Fix |
| --- | --- |
| Missing `HIAPI_API_KEY` | Create a key at [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys). |
| `HTTP 401` / `HTTP 403` | Check the API key. |
| `HTTP 402` / insufficient balance | Add credits in the [HiAPI dashboard](https://www.hiapi.ai/en/dashboard). |
| `HTTP 429` | Wait and retry. |
| Safety error | Revise the prompt. |

For details, see the [English README](README.md).
