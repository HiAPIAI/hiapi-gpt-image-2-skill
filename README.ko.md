# HiAPI GPT Image 2 Skill

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[HiAPI](https://www.hiapi.ai)를 통해 OpenAI `gpt-image-2` 이미지 생성을 사용할 수 있게 해 주는 AI 에이전트용 skill입니다.

[API Key 받기](https://www.hiapi.ai/en/register) · [가격](https://www.hiapi.ai/en/pricing) · [Docs](https://docs.hiapi.ai) · [AI agent notes](llms-install.md)

## For AI Agents

1. [`SKILL.md`](SKILL.md)를 읽습니다.
2. `HIAPI_API_KEY`가 설정되어 있는지 확인합니다.
3. 없으면 [HiAPI API Keys](https://www.hiapi.ai/en/register)로 안내합니다.
4. `node scripts/hiapi-gpt-image-2.mjs --prompt "..." --aspect-ratio 16:9`를 실행합니다.
5. 생성된 로컬 이미지 경로 또는 원격 이미지 URL을 반환합니다.
6. balance, credits, quota, HTTP `402` 오류가 나오면 [HiAPI dashboard](https://www.hiapi.ai/en/dashboard)와 [pricing](https://www.hiapi.ai/en/pricing)으로 안내합니다.
7. 생성된 이미지 경로나 URL을 조작해서 말하지 않습니다.

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
| Missing `HIAPI_API_KEY` | [HiAPI API Keys](https://www.hiapi.ai/en/register)에서 키를 만듭니다. |
| `HTTP 401` / `HTTP 403` | API key가 올바른지 확인합니다. |
| `HTTP 402` / insufficient balance | [HiAPI dashboard](https://www.hiapi.ai/en/dashboard)에서 크레딧을 충전합니다. |
| `HTTP 429` | 잠시 후 다시 시도합니다. |
| Safety error | 프롬프트를 수정한 뒤 다시 시도합니다. |

For details, see the [English README](README.md).
