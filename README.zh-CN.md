# GPT Image 2 图像生成技能

把 GPT Image 2 图像生成接入你的 AI Agent。

**GPT Image 2 • 安装 • API Key • [HiAPI](https://www.hiapi.ai/zh)**

[免费获取 API Key](https://www.hiapi.ai/zh/register) · [查看价格](https://www.hiapi.ai/zh/pricing) · [HiAPI 文档](https://docs.hiapi.ai)

Languages: [English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

---

> AI Agent? 跳过 README，直接看 [llms-install.md](llms-install.md)，里面有专为 Agent 准备的安装步骤和错误处理规则。

---

## 这是什么？

一个适用于 OpenClaw / Claude Code / OpenCode / Codex 类 Agent 的 AI 技能插件。安装后，你的 AI Agent 可以通过 HiAPI 使用 GPT Image 2 进行图像生成。

HiAPI 是为开发者打造的 AI API 平台：一个 API，所有 AI 模型。图像、视频、音乐和文本，一个密钥全搞定。

| 技能 | 描述 | 模型 |
| --- | --- | --- |
| HiAPI GPT Image 2 | 文生图 | GPT Image 2 |

---

## 安装

### 快速安装（OpenClaw）

```bash
openclaw skills add https://github.com/HiAPIAI/hiapi-gpt-image-2-skill
```

### 安装到 Codex

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
cd hiapi-gpt-image-2-skill
npm test

mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R . "${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2"
```

复制后重启 Codex。

### 手动安装到任意 Agent

```bash
git clone https://github.com/HiAPIAI/hiapi-gpt-image-2-skill.git
export AGENT_SKILLS_DIR="/path/to/your/agent/skills"
mkdir -p "$AGENT_SKILLS_DIR"
cp -R hiapi-gpt-image-2-skill "$AGENT_SKILLS_DIR/hiapi-gpt-image-2"
```

将 `AGENT_SKILLS_DIR` 替换为你的 Agent 技能目录。

### Agent 自动安装（复制给你的 Agent）

```text
安装 HiAPI GPT Image 2 图像生成技能：

1. 克隆 https://github.com/HiAPIAI/hiapi-gpt-image-2-skill
2. 把仓库复制到你的技能目录，目录名使用 hiapi-gpt-image-2
3. 设置环境变量 HIAPI_API_KEY
4. 读取 SKILL.md 了解使用方法
```

---

## 获取 API Key

1. 打开 [免费获取 API Key](https://www.hiapi.ai/zh/register)
2. 登录或注册 HiAPI 账号
3. 创建新的 API Key
4. 在运行 Agent 的终端设置环境变量：

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

---

## GPT Image 2 图像生成

通过自然语言让你的 AI Agent 生成图片。

### 功能

- 文生图：描述你想要的画面，生成图片
- 多种比例：`auto`、`1:1`、`16:9`、`9:16`、`4:3`、`3:4`
- 本地输出：图片会保存到 `outputs/`
- URL 输出：如果 HiAPI 返回图片 URL，Agent 会直接返回 URL
- 错误提示：未配置 Key、Key 无效、余额不足、限流、内容安全拦截都有明确下一步

### 使用示例

直接和你的 AI Agent 对话：

> 使用 `$hiapi-gpt-image-2` 生成一张海面日落的 16:9 图片。

> 用 HiAPI GPT Image 2 创建一个极简 Logo，比例 1:1。

> 生成一张 9:16 社交媒体海报，标题文字是「Build Faster」。

### 命令行脚本

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Create a cinematic mountain lake photo at sunset" \
  --aspect-ratio 16:9
```

自定义输出目录：

```bash
node scripts/hiapi-gpt-image-2.mjs \
  --prompt "Minimal poster for an AI image API, premium tech brand style" \
  --aspect-ratio 1:1 \
  --output-dir ./outputs
```

---

## 文件结构

```text
.
├── README.md
├── README.zh-CN.md
├── README.ja.md
├── README.ko.md
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── api.md
│   └── output.md
├── scripts/
│   ├── check-config.mjs
│   ├── hiapi-gpt-image-2.mjs
│   └── lib/
│       └── gpt-image-2.mjs
├── tests/
│   └── gpt-image-2.test.mjs
└── llms-install.md
```

---

## 常见问题

| 问题 | 解决方案 |
| --- | --- |
| `HIAPI_API_KEY is required` | 去 [免费获取 API Key](https://www.hiapi.ai/zh/register) 创建 Key，然后设置 `HIAPI_API_KEY`。 |
| `401 Unauthorized` | 检查 API Key 是否正确，或重新生成 Key。 |
| `402 Payment Required` / 余额不足 | 进入 [HiAPI Dashboard](https://www.hiapi.ai/en/dashboard) 检查账号状态。 |
| `429 Too Many Requests` | 稍后重试，或减少并发生成请求。 |
| 内容被拦截 | 提示词触发了内容安全策略，请修改描述。 |
| 没有图片输出 | 检查接口返回内容；该 skill 期望 `choices[0].message.content` 中包含图片。 |

---

## 兼容性

| Agent | 安装方式 |
| --- | --- |
| OpenClaw | `openclaw skills add https://github.com/HiAPIAI/hiapi-gpt-image-2-skill` |
| Codex | 复制到 `${CODEX_HOME:-$HOME/.codex}/skills/hiapi-gpt-image-2` |
| Claude Code | 复制到 `~/.claude/skills/hiapi-gpt-image-2` |
| OpenCode | 复制到 `~/.opencode/skills/hiapi-gpt-image-2` |
| Cursor / 其他 Agent | 复制到对应技能目录 |

---

## 许可证

MIT

---

[HiAPI](https://www.hiapi.ai/zh) — 一个 API，所有 AI 模型
