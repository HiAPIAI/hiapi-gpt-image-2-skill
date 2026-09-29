import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MODEL = "gpt-image-2/text-to-image";
export const SKILL_ID = "hiapi-gpt-image-2";
export const SKILL_VERSION = "0.5.0";
// 老名 → 新名向后兼容映射：现存用户脚本传老名（gpt-image-2 / gpt-image-2-image-to-image）也能用，
// normalizeModel 入口先归一。退役的 Pro 不在表中 → 传入会落到 throw（提示改用基础版新名）。
export const MODEL_ALIASES = new Map([
  ["gpt-image-2", "gpt-image-2/text-to-image"],
  ["gpt-image-2-image-to-image", "gpt-image-2/image-to-image"],
  ["gpt-image-2/text-to-image", "gpt-image-2/text-to-image"],
  ["gpt-image-2/image-to-image", "gpt-image-2/image-to-image"],
]);
// 文件名安全 slug：新名含 "/"，不能直接拼进本地文件名（会被当路径分隔符导致写入失败）。
export const modelFileSlug = (m) => String(m).replace(/[/@]/g, "-");
export const DEFAULT_BASE_URL = "https://api.hiapi.ai";
export const DEFAULT_SKILLS_MANIFEST_URL = "https://raw.githubusercontent.com/HiAPIAI/hiapi-skills/main/skills.json";
export const DEFAULT_ASPECT_RATIO = "auto";
export const DEFAULT_RESOLUTION = "1K";
export const DEFAULT_OUTPUT_DIR = "outputs";
export const POLL_INTERVAL_MS = 3000;
export const POLL_TIMEOUT_MS = 180000;
export const DEFAULT_SITE_URL = "https://www.hiapi.ai";
export const HIAPI_HOME_URL = "https://www.hiapi.ai";
export const HIAPI_API_KEYS_URL = "https://www.hiapi.ai/en/register";
export const HIAPI_DASHBOARD_URL = "https://www.hiapi.ai/en/dashboard";
export const HIAPI_PRICING_URL = "https://www.hiapi.ai/en/pricing";
export const SUPPORTED_ASPECT_RATIOS = new Set([
  "auto",
  "1:1",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "5:4",
  "4:5",
  "16:9",
  "9:16",
  "2:1",
  "1:2",
  "3:1",
  "1:3",
  "21:9",
  "9:21",
]);
export const SUPPORTED_RESOLUTIONS = new Set(["1K", "2K", "4K"]);
// gpt-image-2/image-to-image accepts 1-16 reference images (HiAPI schema input_urls maxItems=16).
export const MAX_INPUT_URLS = 16;
// Optional background control. HiAPI only accepts `background` when resolution is 1K.
export const SUPPORTED_BACKGROUNDS = new Set(["auto", "opaque", "transparent"]);
// Documented HiAPI default-route rules: these aspect ratios are unavailable at 2K / 4K.
// The text-to-image page also excludes 1:1 at 4K; the image-to-image page does not.
export const TWO_K_BLOCKED_ASPECT_RATIOS = new Set(["5:4", "4:5", "3:1", "1:3", "9:21"]);
export const FOUR_K_BLOCKED_ASPECT_RATIOS = new Set(["1:1", "3:1", "1:3", "9:21"]);
export const IMAGE_TO_IMAGE_FOUR_K_BLOCKED_ASPECT_RATIOS = new Set(["3:1", "1:3", "9:21"]);
// Routes select a channel with its own parameter shape and price. "default" is omitted
// from the payload. beta (text-to-image only) takes `size` instead of aspect_ratio /
// resolution; ext takes every aspect ratio at 1K/2K/4K, requires `quality`, and renames
// image-to-image references to `image_urls` (1-6).
export const DEFAULT_ROUTE = "default";
export const SUPPORTED_ROUTES = new Set(["default", "beta", "ext"]);
export const SUPPORTED_QUALITIES = new Set(["low", "medium", "high"]);
export const DEFAULT_EXT_QUALITY = "low";
export const EXT_MAX_IMAGE_URLS = 6;
export const BETA_SIZE_PATTERN = /^\d{3,5}x\d{3,5}$/;
// Output Storage tier. Default "temp" = free, auto-deleted ~7 days after creation.
// "persistent" keeps the output long-term and is BILLED ($0.05/GB·month). The payload
// omits the field entirely for "temp" so the API default (temporary) applies untouched.
export const DEFAULT_STORAGE = "temp";
export const SUPPORTED_STORAGE = new Set(["temp", "persistent"]);
export const SUPPORTED_MODELS = new Set([
  "gpt-image-2/text-to-image",
  "gpt-image-2/image-to-image",
]);
export const IMAGE_TO_IMAGE_MODELS = new Set([
  "gpt-image-2/image-to-image",
]);

export function normalizeModel(value = MODEL) {
  const raw = String(value || MODEL).trim();
  const mapped = MODEL_ALIASES.get(raw); // 老名先归一到新名（向后兼容）
  if (mapped) return mapped;
  if (SUPPORTED_MODELS.has(raw)) return raw;
  throw new Error(
    `Unsupported model "${raw}". The Pro variants (gpt-image-2-pro / gpt-image-2-image-to-image-pro) ` +
      `have been retired — use ${Array.from(SUPPORTED_MODELS).join(" or ")}.`,
  );
}

export function normalizeStorage(value = DEFAULT_STORAGE) {
  // Only an omitted value (undefined) falls back to the default. Empty string / null
  // are treated as explicit invalid input so a malformed value never silently
  // resolves to "temp" — it surfaces the same cost-aware error as any bad value.
  const storage = String(value ?? "").trim().toLowerCase();
  if (!SUPPORTED_STORAGE.has(storage)) {
    throw new Error(
      `Unsupported storage "${storage}". Use one of: ${Array.from(SUPPORTED_STORAGE).join(", ")}. ` +
        `"persistent" keeps outputs beyond ~7 days and is billed ($0.05/GB·month); see https://docs.hiapi.ai/storage/.`,
    );
  }
  return storage;
}

export function normalizeAspectRatio(value = DEFAULT_ASPECT_RATIO, model = MODEL) {
  const normalized = String(value || DEFAULT_ASPECT_RATIO).trim();
  const normalizedModel = normalizeModel(model);
  if (!SUPPORTED_ASPECT_RATIOS.has(normalized)) {
    throw new Error(
      `Unsupported aspect ratio "${normalized}" for ${normalizedModel}. Supported values: ${Array.from(SUPPORTED_ASPECT_RATIOS).join(", ")}`,
    );
  }
  return normalized;
}

export function normalizeResolution(value = DEFAULT_RESOLUTION, model = MODEL) {
  const resolution = String(value || DEFAULT_RESOLUTION).trim().toUpperCase();
  const normalizedModel = normalizeModel(model);
  if (!SUPPORTED_RESOLUTIONS.has(resolution)) {
    throw new Error(
      `Unsupported resolution "${resolution}" for ${normalizedModel}. Supported values: ${Array.from(SUPPORTED_RESOLUTIONS).join(", ")}`,
    );
  }
  return resolution;
}

export function normalizeBackground(value) {
  // Omitted background stays omitted so the API default applies untouched.
  if (value === undefined || value === null || value === "") return undefined;
  const background = String(value).trim().toLowerCase();
  if (!SUPPORTED_BACKGROUNDS.has(background)) {
    throw new Error(
      `Unsupported background "${background}". Use one of: ${Array.from(SUPPORTED_BACKGROUNDS).join(", ")}.`,
    );
  }
  return background;
}

export function normalizeRoute(value, model = MODEL) {
  const route = String(value ?? DEFAULT_ROUTE).trim().toLowerCase() || DEFAULT_ROUTE;
  if (!SUPPORTED_ROUTES.has(route)) {
    throw new Error(`Unsupported route "${route}". Use one of: ${Array.from(SUPPORTED_ROUTES).join(", ")}.`);
  }
  if (route === "beta" && IMAGE_TO_IMAGE_MODELS.has(normalizeModel(model))) {
    throw new Error("The beta route is only available for gpt-image-2/text-to-image. Use the default or ext route for image-to-image.");
  }
  return route;
}

export function normalizeQuality(value = DEFAULT_EXT_QUALITY) {
  const quality = String(value ?? "").trim().toLowerCase();
  if (!SUPPORTED_QUALITIES.has(quality)) {
    throw new Error(`Unsupported quality "${quality}". Use one of: ${Array.from(SUPPORTED_QUALITIES).join(", ")}.`);
  }
  return quality;
}

export function normalizeSize(value = "auto") {
  const size = String(value ?? "").trim();
  if (size !== "auto" && !BETA_SIZE_PATTERN.test(size)) {
    throw new Error(`Unsupported size "${size}". Use auto or lowercase WIDTHxHEIGHT with 3-5 digits each, such as 1024x1024.`);
  }
  return size;
}

export function normalizeInputUrls(value) {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function buildImagePayload({
  model = MODEL,
  route,
  prompt,
  aspectRatio,
  resolution,
  inputUrls,
  background,
  quality,
  size,
  storage,
} = {}) {
  const normalizedModel = normalizeModel(model);
  const normalizedRoute = normalizeRoute(route, normalizedModel);
  const normalizedPrompt = String(prompt || "").trim();
  if (!normalizedPrompt) {
    throw new Error("A non-empty prompt is required.");
  }

  const isImageToImage = IMAGE_TO_IMAGE_MODELS.has(normalizedModel);
  const maxInputUrls = normalizedRoute === "ext" ? EXT_MAX_IMAGE_URLS : MAX_INPUT_URLS;
  const inputUrlField = normalizedRoute === "ext" ? "image_urls" : "input_urls";
  const normalizedInputUrls = normalizeInputUrls(inputUrls);
  if (isImageToImage && (normalizedInputUrls.length < 1 || normalizedInputUrls.length > maxInputUrls)) {
    throw new Error(`${normalizedModel} requires 1-${maxInputUrls} input image URLs via ${inputUrlField} on the ${normalizedRoute} route.`);
  }
  if (!isImageToImage && normalizedInputUrls.length > 0) {
    throw new Error(`${normalizedModel} does not accept input_urls. Use gpt-image-2/image-to-image.`);
  }

  const has = (value) => value !== undefined && value !== null && value !== "";
  const rejectOutsideRoute = (flag, value, allowedRoute) => {
    if (has(value) && normalizedRoute !== allowedRoute) {
      throw new Error(`${flag} is only accepted on the ${allowedRoute} route; this request uses the ${normalizedRoute} route.`);
    }
  };
  rejectOutsideRoute("--size", size, "beta");
  rejectOutsideRoute("--quality", quality, "ext");

  let input;
  if (normalizedRoute === "beta") {
    for (const [flag, value] of [["--aspect-ratio", aspectRatio], ["--resolution", resolution], ["--background", background]]) {
      if (has(value)) throw new Error(`${flag} is not accepted on the beta route; use --size instead.`);
    }
    input = { prompt: normalizedPrompt, size: normalizeSize(has(size) ? size : "auto") };
  } else if (normalizedRoute === "ext") {
    if (has(background)) throw new Error("--background is not accepted on the ext route.");
    input = {
      prompt: normalizedPrompt,
      ...(isImageToImage ? { image_urls: normalizedInputUrls } : {}),
      // ext documents a 1:1 default for text-to-image and auto (follow the input) for image-to-image.
      aspect_ratio: normalizeAspectRatio(has(aspectRatio) ? aspectRatio : (isImageToImage ? "auto" : "1:1"), normalizedModel),
      resolution: normalizeResolution(has(resolution) ? resolution : DEFAULT_RESOLUTION, normalizedModel),
      quality: normalizeQuality(has(quality) ? quality : DEFAULT_EXT_QUALITY),
    };
  } else {
    const normalizedAspectRatio = normalizeAspectRatio(has(aspectRatio) ? aspectRatio : DEFAULT_ASPECT_RATIO, normalizedModel);
    const normalizedResolution = normalizeResolution(has(resolution) ? resolution : DEFAULT_RESOLUTION, normalizedModel);
    const normalizedBackground = normalizeBackground(background);
    const fourKBlocked = isImageToImage ? IMAGE_TO_IMAGE_FOUR_K_BLOCKED_ASPECT_RATIOS : FOUR_K_BLOCKED_ASPECT_RATIOS;

    // Cross-field constraints documented for the default route.
    if (normalizedAspectRatio === "auto" && normalizedResolution !== "1K") {
      throw new Error(
        `aspect_ratio "auto" only supports resolution "1K" for ${normalizedModel}. Use --resolution 1K, or pick an explicit aspect ratio for ${normalizedResolution}.`,
      );
    }
    if (normalizedResolution === "2K" && TWO_K_BLOCKED_ASPECT_RATIOS.has(normalizedAspectRatio)) {
      throw new Error(
        `aspect_ratio "${normalizedAspectRatio}" cannot be combined with resolution "2K" for ${normalizedModel}. Use ${fourKBlocked.has(normalizedAspectRatio) ? "1K" : "1K or 4K"}, pick another aspect ratio, or use --route ext.`,
      );
    }
    if (normalizedResolution === "4K" && fourKBlocked.has(normalizedAspectRatio)) {
      throw new Error(
        `aspect_ratio "${normalizedAspectRatio}" cannot be combined with resolution "4K" for ${normalizedModel}. Use ${TWO_K_BLOCKED_ASPECT_RATIOS.has(normalizedAspectRatio) ? "1K" : "1K or 2K"}, pick another aspect ratio, or use --route ext.`,
      );
    }
    if (normalizedBackground !== undefined && normalizedResolution !== "1K") {
      throw new Error(
        `background "${normalizedBackground}" only supports resolution "1K" for ${normalizedModel}. Use --resolution 1K, or omit --background for ${normalizedResolution}.`,
      );
    }

    input = {
      prompt: normalizedPrompt,
      ...(normalizedInputUrls.length > 0 ? { input_urls: normalizedInputUrls } : {}),
      aspect_ratio: normalizedAspectRatio,
      resolution: normalizedResolution,
      ...(normalizedBackground !== undefined ? { background: normalizedBackground } : {}),
    };
  }

  // storage is a TOP-LEVEL field (sibling of model/input), per HiAPI Output Storage docs.
  // Only emit it for "persistent"; "temp" is the API default and is left implicit.
  const normalizedStorage = normalizeStorage(storage);

  return {
    model: normalizedModel,
    ...(normalizedRoute !== DEFAULT_ROUTE ? { route: normalizedRoute } : {}),
    input,
    ...(normalizedStorage === "persistent" ? { storage: "persistent" } : {}),
  };
}

// Summary fields shared by the CLI result shapes.
export function describePayload(payload) {
  return {
    model: payload.model,
    route: payload.route ?? DEFAULT_ROUTE,
    ...(payload.input.size ? { size: payload.input.size } : {}),
    ...(payload.input.aspect_ratio ? { aspectRatio: payload.input.aspect_ratio } : {}),
    ...(payload.input.resolution ? { resolution: payload.input.resolution } : {}),
    ...(payload.input.quality ? { quality: payload.input.quality } : {}),
    ...(payload.input.background ? { background: payload.input.background } : {}),
    storage: payload.storage ?? "temp",
  };
}

export function normalizeIdempotencyKey(value) {
  const key = String(value ?? randomUUID()).trim();
  if (!key || /[\u0000-\u001f\u007f]/.test(key)) {
    throw new Error("--idempotency-key must be non-empty and contain no control characters.");
  }
  if (Buffer.byteLength(key, "utf8") > 255) {
    throw new Error("--idempotency-key must be at most 255 UTF-8 bytes.");
  }
  return key;
}

// Non-billing estimate from the public pricing list. Routed prices are listed under the
// canonical routed ID (gpt-image-2/text-to-image@ext) while the request keeps model + route.
export async function fetchPricingEstimate(payload, { fetchImpl = fetch, siteUrl = process.env.HIAPI_SITE_URL || DEFAULT_SITE_URL } = {}) {
  const pricingModel = payload.route ? `${payload.model}@${payload.route}` : payload.model;
  const response = await fetchImpl(`${String(siteUrl).replace(/\/+$/, "")}/api/pricing`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Pricing check failed with HTTP ${response.status}.`);
  const body = await response.json();
  const row = body?.data?.find((entry) => entry?.model_name === pricingModel);
  if (!row) throw new Error(`Current public pricing does not list ${pricingModel}.`);
  const policy = (row.policies || []).find((entry) =>
    Object.entries(entry.rule || {}).every(([key, rule]) =>
      rule?.with === true ? payload.input[key] !== undefined : payload.input[key] === rule?.match,
    ),
  );
  const unitUsd = Number(policy?.usd_value ?? row.base_usd_value);
  return {
    pricingModel,
    estimatedUsd: Number.isFinite(unitUsd) ? Number(unitUsd.toFixed(4)) : null,
    billingBasis: row.base_display_unit?.en || "per image",
    pricingPage: HIAPI_PRICING_URL,
    note: payload.route === "ext" && payload.input.image_urls
      ? "Snapshot estimate only; ext image-to-image pricing also depends on the reference count. Final billing follows the accepted task."
      : "Snapshot estimate only; final billing follows the accepted task.",
  };
}

export const buildChatPayload = buildImagePayload;

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
  const taskOutput = response?.data?.output || response?.output;
  if (Array.isArray(taskOutput)) {
    return taskOutput.flatMap((entry) => imageOutputFromEntry(entry)).filter(Boolean);
  }

  const directTaskOutput = imageOutputFromEntry(taskOutput || response?.data);
  if (directTaskOutput) return [directTaskOutput];

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

export function extractTaskId(response) {
  return response?.data?.taskId || response?.data?.id || response?.data?.task_id || response?.id || response?.task_id || "";
}

export function getTaskStatus(response) {
  const status = response?.status || response?.data?.status || "";
  return String(status).toLowerCase();
}

export function extractTaskFailureSummary(response) {
  const candidates = [
    response?.data?.error,
    response?.data?.fail_reason,
    response?.data?.failReason,
    response?.data?.error_message,
    response?.data?.errorMessage,
    response?.data?.task_status_msg,
    response?.data?.taskStatusMsg,
    response?.data?.output?.error,
    response?.data?.output?.fail_reason,
    response?.data?.output?.error_message,
    response?.data?.output?.task_status_msg,
    response?.error,
    response?.fail_reason,
    response?.error_message,
    response?.task_status_msg,
    response?.message,
  ];

  for (const candidate of candidates) {
    const summary = summarizeErrorBody(candidate);
    if (isUsefulFailureSummary(summary)) return summary;
  }

  const taskId = extractTaskId(response);
  return taskId
    ? `task failed without a public failure reason. Task ID: ${taskId}`
    : "task failed without a public failure reason.";
}

export async function createImageTask(payload, { config = resolveConfig(), fetchImpl = fetch, idempotencyKey } = {}) {
  return requestJson(`${config.baseUrl}/v1/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      // HiAPI replays the original task for a repeated key with the same body instead of creating another.
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(payload),
  }, fetchImpl);
}

export async function getImageTask(taskId, { config = resolveConfig(), fetchImpl = fetch } = {}) {
  return requestJson(`${config.baseUrl}/v1/tasks/${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  }, fetchImpl);
}

export async function waitForImage(taskId, { config = resolveConfig(), fetchImpl = fetch, pollIntervalMs = POLL_INTERVAL_MS, timeoutMs = POLL_TIMEOUT_MS } = {}) {
  const deadline = Date.now() + Number(timeoutMs);

  while (Date.now() < deadline) {
    await sleep(Number(pollIntervalMs));
    const response = await getImageTask(taskId, { config, fetchImpl });
    const status = getTaskStatus(response);

    if (status === "success" || status === "succeeded" || status === "completed") {
      const outputs = extractImageOutputs(response);
      if (outputs.length === 0) {
        throw new Error("Image task succeeded but no image output was returned.");
      }
      return { response, outputs };
    }

    if (status === "fail" || status === "failed") {
      throw new Error(`Image generation failed: ${extractTaskFailureSummary(response)}`);
    }
  }

  throw new Error(
    `Image generation timed out after ${Math.round(Number(timeoutMs) / 1000)} seconds. Task ${taskId} may still be running; recover it with --resume-task-id ${taskId} (no new task is created).`,
  );
}

export async function generateImage(options, config = resolveConfig()) {
  const payload = buildImagePayload(options);
  const idempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);
  const created = await createImageTask(payload, { config, idempotencyKey });
  const taskId = extractTaskId(created);
  if (!taskId) {
    throw new Error(`No image task id returned; task acceptance is unknown. Retry with the same idempotency key (${idempotencyKey}) instead of creating another task.`);
  }

  if (options.wait === false) {
    return { ...describePayload(payload), taskId, idempotencyKey, status: "created", outputs: [] };
  }

  const { response, outputs } = await waitForImage(taskId, {
    config,
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
  });
  const savedOutputs = options.save === false
    ? outputs.map((output) => output.kind === "url"
      ? { kind: "url", url: output.value }
      : { kind: "data-uri", value: output.value, mimeType: output.mimeType })
    : await saveImageOutputs(outputs, {
      outputDir: options.outputDir || DEFAULT_OUTPUT_DIR,
    });

  return { ...describePayload(payload), taskId, idempotencyKey, outputs: savedOutputs, rawStatus: response };
}

export async function callHiApi({ config, payload, fetchImpl = fetch }) {
  return createImageTask(payload, { config, fetchImpl });
}

export async function requestJson(url, init, fetchImpl = fetch) {
  const response = await fetchImpl(url, init);
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

export async function checkSkillUpdate({
  currentVersion = SKILL_VERSION,
  skillId = SKILL_ID,
  manifestUrl = process.env.HIAPI_SKILLS_MANIFEST_URL || DEFAULT_SKILLS_MANIFEST_URL,
  fetchImpl = fetch,
  timeoutMs = 1200,
  env = process.env,
} = {}) {
  if (env.HIAPI_SKIP_UPDATE_CHECK === "1" || env.HIAPI_SKIP_UPDATE_CHECK === "true") {
    return { status: "skipped" };
  }

  let response;
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    response = await fetchImpl(manifestUrl, {
      headers: { Accept: "application/json" },
      signal: controller?.signal,
    });
  } catch {
    return { status: "skipped" };
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!response?.ok) return { status: "skipped" };

  let manifest;
  try {
    manifest = await response.json();
  } catch {
    return { status: "skipped" };
  }

  const skill = Array.isArray(manifest.skills)
    ? manifest.skills.find((entry) => entry?.id === skillId)
    : null;
  const policy = skill?.updatePolicy;
  if (!policy) return { status: "current" };

  const minimumVersion = policy.minimumVersion || skill.version || currentVersion;
  const latestVersion = policy.latestVersion || skill.version || minimumVersion;
  const updateCommand = policy.updateCommand || `npx -y github:HiAPIAI/hiapi-gpt-image-2-skill -y`;

  if (compareVersions(currentVersion, minimumVersion) < 0) {
    return {
      status: "required",
      message: [
        policy.requiredNotice || "This HiAPI skill version is no longer compatible with the current HiAPI API.",
        `Installed version: ${currentVersion}; required version: ${minimumVersion}.`,
        `Update now: ${updateCommand}`,
      ].join("\n"),
      latestVersion,
      minimumVersion,
      updateCommand,
    };
  }

  if (compareVersions(currentVersion, latestVersion) < 0) {
    return {
      status: "available",
      message: [
        policy.notice || "A newer HiAPI skill is available.",
        `Installed version: ${currentVersion}; latest version: ${latestVersion}.`,
        `Update: ${updateCommand}`,
      ].join("\n"),
      latestVersion,
      minimumVersion,
      updateCommand,
    };
  }

  return { status: "current", latestVersion, minimumVersion, updateCommand };
}

export async function warnOrRequireSkillUpdate(options = {}) {
  const result = await checkSkillUpdate(options);
  if (result.status === "required") {
    throw new Error(result.message);
  }
  if (result.status === "available" && result.message) {
    console.error(result.message);
  }
  return result;
}

export function compareVersions(left, right) {
  const parse = (value) => String(value || "0.0.0")
    .split(/[+-]/, 1)[0]
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < Math.max(a.length, b.length, 3); index += 1) {
    const delta = (a[index] || 0) - (b[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}

export function summarizeErrorBody(body) {
  if (!body) return "Unknown error";
  if (typeof body === "string") return body.slice(0, 500);
  if (body?.code && body?.message && body.message !== "success") {
    return `${body.code}: ${body.message}`.slice(0, 500);
  }
  if (body?.error?.message) return String(body.error.message).slice(0, 500);
  if (body?.message) return String(body.message).slice(0, 500);
  if (body?.raw) return String(body.raw).slice(0, 500);
  return JSON.stringify(body).slice(0, 500);
}

function isUsefulFailureSummary(summary) {
  const normalized = String(summary || "").trim().toLowerCase();
  return normalized !== "" && normalized !== "unknown error" && normalized !== "success" && normalized !== "ok";
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

function imageOutputFromEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const value =
    entry.url ||
    entry.image_url ||
    entry.data ||
    entry.b64_json ||
    entry.base64 ||
    entry.content ||
    "";

  if (typeof value !== "string" || !value.trim()) return null;
  if (value.startsWith("data:image/")) {
    const mimeMatch = value.match(/^data:([^;]+);base64,/);
    return {
      kind: "data-uri",
      mimeType: mimeMatch?.[1] || entry.mime_type || "image/png",
      value,
    };
  }
  if (/^https?:\/\//.test(value)) {
    return { kind: "url", value };
  }
  if (/^[A-Za-z0-9+/=]+$/.test(value) && value.length > 64) {
    const mimeType = entry.mime_type || entry.mimeType || "image/png";
    return {
      kind: "data-uri",
      mimeType,
      value: `data:${mimeType};base64,${value}`,
    };
  }
  return null;
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
    const fileName = `${modelFileSlug(MODEL)}-${formatTimestamp(now)}-${index}${extension}`;
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
