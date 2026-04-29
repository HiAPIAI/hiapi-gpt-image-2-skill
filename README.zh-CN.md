# HiAPI GPT Image 2 Skill

[English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

通过 [HiAPI](https://www.hiapi.ai) 调用 OpenAI `gpt-image-2` 生成图片，并把它封装成 AI Agent 可以直接读取、安装和运行的 skill。

[获取 API Key](https://www.hiapi.ai/en/dashboard/api-keys) · [充值/查看余额](https://www.hiapi.ai/en/dashboard) · [价格](https://www.hiapi.ai/zh/pricing) · [HiAPI 文档](https://docs.hiapi.ai) · [AI Agent 安装说明](llms-install.md)

## 给 AI Agent 看的快速说明

如果你是正在读取这个仓库的 AI Agent：

1. 先读取 [`SKILL.md`](SKILL.md)。
2. 检查环境变量 `HIAPI_API_KEY` 是否存在。
3. 如果用户没有配置 Key，引导用户去 [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys) 创建。
4. 执行 `node scripts/hiapi-gpt-image-2.mjs --prompt "..." --aspect-ratio 16:9`。
5. 返回生成后的本地图片路径或远程图片 URL。
6. 如果接口提示余额、credits、quota 或 HTTP `402`，引导用户去 [HiAPI Dashboard](https://www.hiapi.ai/en/dashboard) 充值或检查账单。
7. 不要伪造生成成功、图片路径或图片 URL。

可直接复制给 Agent 的提示词：

```text
使用 $hiapi-gpt-image-2 通过 HiAPI 生成一张 16:9 的产品发布海报。如果我没有配置 API Key 或余额不足，请告诉我去哪里配置。
```

## 这是什么？

一个适用于 OpenClaw / Claude Code / OpenCode / Codex 类 Agent 的 AI 技能插件，由 [HiAPI](https://www.hiapi.ai) 驱动。安装后，你的 AI Agent 即可使用 GPT Image 2 模型进行图片生成。

| 技能 | 描述 | 模型 |
| --- | --- | --- |
| HiAPI GPT Image 2 | 通过 HiAPI 进行文生图 | GPT Image 2 |

## 能力概览

| 项目 | 内容 |
| --- | --- |
| Skill 名称 | `hiapi-gpt-image-2` |
| 模型 | `gpt-image-2` |
| 服务 | HiAPI |
| 端点 | `POST /v1/chat/completions` |
| 能力 | 文生图 |
| 输出 | 本地图片文件或远程图片 URL |
| 运行环境 | Node.js 18+ |

## 安装

克隆仓库：

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test
```

安装到 Codex：

```bash
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

复制后重启 Codex。

其他 Agent 运行时可以把本目录复制或软链接到对应的 skills 目录：

```bash
export AGENT_SKILLS_DIR="/path/to/your/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
ln -s "$PWD" "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

## 配置 HiAPI

创建 API Key：

```text
https://www.hiapi.ai/en/dashboard/api-keys
```

设置环境变量：

```bash
export HIAPI_API_KEY="your_hiapi_api_key_here"
export HIAPI_BASE_URL="https://api.hiapi.ai"
```

检查配置：

```bash
node scripts/check-config.mjs
```

联网检查：

```bash
node scripts/check-config.mjs --live
```

## 使用示例

```text
使用 $hiapi-gpt-image-2 为一个 AI 写作应用生成 16:9 产品发布海报。
```

```text
通过 HiAPI GPT Image 2 生成一个 1:1 的开发者工具 App 图标概念图。
```

```text
用 GPT Image 2 生成一张 9:16 社交媒体海报，标题文字是「Build Faster」。
```

## CLI 用法

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Create a cinematic mountain lake photo at sunset" \
  --aspect-ratio 16:9
```

## 错误处理

| 错误 | 处理方式 |
| --- | --- |
| `HIAPI_API_KEY is required` | 去 [HiAPI API Keys](https://www.hiapi.ai/en/dashboard/api-keys) 创建 Key，然后设置 `HIAPI_API_KEY`。 |
| `HTTP 401` 或 `HTTP 403` | 检查 API Key 是否有效、是否复制完整。 |
| `HTTP 402`、余额不足、credits、quota | 去 [HiAPI Dashboard](https://www.hiapi.ai/en/dashboard) 充值或检查账单，价格见 [Pricing](https://www.hiapi.ai/zh/pricing)。 |
| `HTTP 429` | 稍后重试，或减少并发生成请求。 |
| 内容安全策略错误 | 修改 prompt 后重试。 |
| 没有提取到图片 | 该 skill 期望 `choices[0].message.content` 中包含 Markdown 图片。 |

## API 合同

```http
POST https://api.hiapi.ai/v1/chat/completions
Authorization: Bearer $HIAPI_API_KEY
Content-Type: application/json
```

```json
{
  "model": "gpt-image-2",
  "stream": false,
  "messages": [
    {
      "role": "user",
      "content": "Create a launch poster for an AI note-taking app"
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

返回图片通常在：

```text
choices[0].message.content
```

## 相关 HiAPI 能力

这个 skill 适合在明确使用 `gpt-image-2` 文生图时使用。

如果需要图片编辑、视频生成或其他 HiAPI 图像/视频模型，请使用 [HiAPI MCP](https://docs.hiapi.ai) 或对应的 HiAPI API 文档。
