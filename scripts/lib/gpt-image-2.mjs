import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MODEL = "gpt-image-2";
export const DEFAULT_BASE_URL = "https://api.hiapi.ai";
export const DEFAULT_ASPECT_RATIO = "1:1";
export const HIAPI_HOME_URL = "https://www.hiapi.ai";
export const HIAPI_API_KEYS_URL = "https://www.hiapi.ai/en/dashboard/api-keys";
export const HIAPI_DASHBOARD_URL = "https://www.hiapi.ai/en/dashboard";
export const HIAPI_PRICING_URL = "https://www.hiapi.ai/en/pricing";
export const SUPPORTED_ASPECT_RATIOS = new Set([
  "auto",
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
]);

export function normalizeAspectRatio(value = DEFAULT_ASPECT_RATIO) {
  const normalized = String(value || DEFAULT_ASPECT_RATIO).trim();
  if (!SUPPORTED_ASPECT_RATIOS.has(normalized)) {
    throw new Error(
      `Unsupported aspect ratio "${normalized}". Supported values: ${Array.from(SUPPORTED_ASPECT_RATIOS).join(", ")}`,
    );
  }
  return normalized;
}

export function buildChatPayload({ prompt, aspectRatio = DEFAULT_ASPECT_RATIO }) {
  const normalizedPrompt = String(prompt || "").trim();
  if (!normalizedPrompt) {
    throw new Error("A non-empty prompt is required.");
  }

  return {
    model: MODEL,
    stream: false,
    messages: [{ role: "user", content: normalizedPrompt }],
    extra_body: {
      google: {
        image_config: {
          aspect_ratio: normalizeAspectRatio(aspectRatio),
        },
      },
    },
  };
}

export function resolveConfig(env = process.env) {
  const apiKey = String(env.HIAPI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error(
      `HIAPI_API_KEY is required. Get one at ${HIAPI_API_KEYS_URL}, then run: export HIAPI_API_KEY="your_hiapi_api_key_here"`,
    );
  }

  const baseUrl = String(env.HIAPI_BASE_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, "");

  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error("HIAPI_BASE_URL must start with http:// or https://.");
  }

  return { apiKey, baseUrl };
}

export function extractImageOutputs(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return [];
  }

  const outputs = [];
  const markdownImagePattern = /!\[[^\]]*]\(([^)\s]+)\)/g;

  for (const match of content.matchAll(markdownImagePattern)) {
    const target = match[1];
    if (target.startsWith("data:image/")) {
      const mimeMatch = target.match(/^data:([^;]+);base64,/);
      outputs.push({
        kind: "data-uri",
        mimeType: mimeMatch?.[1] || "image/png",
        value: target,
      });
    } else if (/^https?:\/\//.test(target)) {
      outputs.push({ kind: "url", value: target });
    }
  }

  return outputs;
}

export async function callHiApi({ config, payload, fetchImpl = fetch }) {
  const response = await fetchImpl(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    throw new Error(buildHttpErrorMessage(response.status, json));
  }

  return json;
}

export function summarizeErrorBody(body) {
  if (body?.error?.message) return String(body.error.message).slice(0, 500);
  if (body?.message) return String(body.message).slice(0, 500);
  if (body?.raw) return String(body.raw).slice(0, 500);
  return JSON.stringify(body).slice(0, 500);
}

export function buildHttpErrorMessage(status, body) {
  const summary = summarizeErrorBody(body);
  const lowerSummary = summary.toLowerCase();
  const guidance = guidanceForHttpError(status, lowerSummary);
  return `HiAPI request failed with HTTP ${status}: ${summary}\n${guidance}`;
}

function guidanceForHttpError(status, lowerSummary) {
  if (status === 401 || status === 403) {
    return `Check your HiAPI API key or create a new one: ${HIAPI_API_KEYS_URL}`;
  }

  if (
    status === 402 ||
    lowerSummary.includes("insufficient") ||
    lowerSummary.includes("balance") ||
    lowerSummary.includes("credit") ||
    lowerSummary.includes("quota")
  ) {
    return `Your HiAPI balance or credits may be insufficient. Add credits or check billing in the HiAPI dashboard: ${HIAPI_DASHBOARD_URL}. Pricing: ${HIAPI_PRICING_URL}`;
  }

  if (status === 429) {
    return "The request was rate limited. Please wait and retry, or reduce concurrent image generation requests.";
  }

  if (
    lowerSummary.includes("content_policy") ||
    lowerSummary.includes("policy") ||
    lowerSummary.includes("safety")
  ) {
    return "The prompt may have triggered a safety policy. Revise the prompt and try again.";
  }

  return `If this keeps happening, verify your HiAPI key, account status, and model access in the HiAPI dashboard: ${HIAPI_DASHBOARD_URL}`;
}

export async function saveImageOutputs(outputs, { outputDir, now = new Date() }) {
  await mkdir(outputDir, { recursive: true });
  const saved = [];
  let index = 1;

  for (const output of outputs) {
    if (output.kind === "url") {
      saved.push({ kind: "url", url: output.value });
      continue;
    }

    const extension = extensionForMimeType(output.mimeType);
    const fileName = `${MODEL}-${formatTimestamp(now)}-${index}${extension}`;
    const filePath = path.resolve(outputDir, fileName);
    const base64 = output.value.replace(/^data:[^;]+;base64,/, "");
    await writeFile(filePath, Buffer.from(base64, "base64"));
    saved.push({ kind: "file", path: filePath, mimeType: output.mimeType });
    index += 1;
  }

  return saved;
}

export function extensionForMimeType(mimeType) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  return ".png";
}

function formatTimestamp(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+$/, "")
    .replace("T", "-");
}
