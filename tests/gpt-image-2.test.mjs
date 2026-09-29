import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  buildImagePayload,
  buildHttpErrorMessage,
  checkSkillUpdate,
  compareVersions,
  createImageTask,
  extractTaskFailureSummary,
  extractTaskId,
  extractImageOutputs,
  fetchPricingEstimate,
  modelFileSlug,
  normalizeIdempotencyKey,
  normalizeModel,
  normalizeAspectRatio,
  normalizeBackground,
  normalizeStorage,
  resolveConfig,
  saveImageOutputs,
} from "../scripts/lib/gpt-image-2.mjs";
import { parseArgs } from "../scripts/hiapi-gpt-image-2.mjs";

test("builds the HiAPI task payload for gpt-image-2/text-to-image", () => {
  const payload = buildImagePayload({
    prompt: "Create a product poster",
    aspectRatio: "16:9",
    resolution: "1K",
  });

  assert.deepEqual(payload, {
    model: "gpt-image-2/text-to-image",
    input: {
      prompt: "Create a product poster",
      aspect_ratio: "16:9",
      resolution: "1K",
    },
  });
});

test("builds GPT Image 2 image-to-image task payloads with input_urls", () => {
  const payload = buildImagePayload({
    model: "gpt-image-2/image-to-image",
    prompt: "Restyle this product photo as a premium catalog image",
    inputUrls: ["https://example.com/reference-1.png", "https://example.com/reference-2.png"],
    aspectRatio: "16:9",
    resolution: "2K",
  });

  assert.deepEqual(payload, {
    model: "gpt-image-2/image-to-image",
    input: {
      prompt: "Restyle this product photo as a premium catalog image",
      input_urls: ["https://example.com/reference-1.png", "https://example.com/reference-2.png"],
      aspect_ratio: "16:9",
      resolution: "2K",
    },
  });
});

test("validates GPT Image 2 model variants and image-to-image inputs", () => {
  assert.equal(normalizeModel("gpt-image-2/text-to-image"), "gpt-image-2/text-to-image");
  assert.equal(normalizeModel("gpt-image-2/image-to-image"), "gpt-image-2/image-to-image");
  assert.throws(() => normalizeModel("gpt-image-2-beta"), /Unsupported model/);
  assert.throws(
    () => buildImagePayload({
      model: "gpt-image-2/image-to-image",
      prompt: "Restyle this",
      inputUrls: [],
    }),
    /requires 1-16 input image URLs/,
  );
  assert.throws(
    () => buildImagePayload({
      model: "gpt-image-2/image-to-image",
      prompt: "Restyle this",
      inputUrls: Array.from({ length: 17 }, (_, index) => `https://example.com/${index}.png`),
    }),
    /requires 1-16 input image URLs/,
  );
  assert.throws(
    () => buildImagePayload({
      prompt: "Restyle this",
      inputUrls: ["https://example.com/a.png"],
    }),
    /does not accept input_urls/,
  );
});

test("normalizes legacy model names to the new slash names", () => {
  assert.equal(normalizeModel("gpt-image-2"), "gpt-image-2/text-to-image");
  assert.equal(normalizeModel("gpt-image-2-image-to-image"), "gpt-image-2/image-to-image");
  assert.equal(
    buildImagePayload({ model: "gpt-image-2", prompt: "p" }).model,
    "gpt-image-2/text-to-image",
  );
});

test("rejects retired Pro variants with guidance to the base models", () => {
  assert.throws(() => normalizeModel("gpt-image-2-pro"), /retired/);
  assert.throws(() => normalizeModel("gpt-image-2-image-to-image-pro"), /retired/);
});

test("accepts the current GPT Image 2 aspect ratio set", () => {
  assert.equal(normalizeAspectRatio("2:1"), "2:1");
  assert.equal(normalizeAspectRatio("9:21"), "9:21");
  assert.throws(() => normalizeAspectRatio("10:7"), /Unsupported aspect ratio/);
});

test("extracts task ids and image outputs from task responses", () => {
  assert.equal(extractTaskId({ data: { taskId: "tk-hiapi-123" } }), "tk-hiapi-123");
  assert.equal(extractTaskId({ task_id: "task_456" }), "task_456");

  assert.deepEqual(
    extractImageOutputs({
      data: {
        output: [
          { type: "image", url: "https://cdn.example.com/out.png" },
          { type: "image", data: "data:image/png;base64,AAA" },
        ],
      },
    }),
    [
      { kind: "url", value: "https://cdn.example.com/out.png" },
      { kind: "data-uri", mimeType: "image/png", value: "data:image/png;base64,AAA" },
    ],
  );
});

test("extracts task failure reason from failed task detail instead of outer success message", () => {
  assert.equal(
    extractTaskFailureSummary({
      code: 200,
      message: "success",
      data: {
        status: "fail",
        taskId: "tk-hiapi-failed",
        error: {
          code: "TASK_FAILED",
          message: "task failed",
        },
      },
    }),
    "TASK_FAILED: task failed",
  );
});

test("creates image tasks through the unified tasks endpoint", async () => {
  let requestedUrl = "";
  let requestedInit = {};
  const fetchImpl = async (url, init) => {
    requestedUrl = url;
    requestedInit = init;
    return new Response(JSON.stringify({ data: { taskId: "tk-hiapi-123" } }), {
      status: 200,
    });
  };

  const payload = buildImagePayload({ prompt: "Create a poster", aspectRatio: "1:1" });
  const response = await createImageTask(payload, {
    config: { apiKey: "test-key", baseUrl: "https://api.hiapi.ai" },
    fetchImpl,
  });

  assert.equal(requestedUrl, "https://api.hiapi.ai/v1/tasks");
  assert.equal(requestedInit.method, "POST");
  assert.equal(requestedInit.headers.Authorization, "Bearer test-key");
  assert.deepEqual(JSON.parse(requestedInit.body), payload);
  assert.equal(extractTaskId(response), "tk-hiapi-123");
});

test("keeps markdown image extraction for legacy responses", () => {
  const response = {
    choices: [
      {
        message: {
          content:
            "Result: ![image](data:image/png;base64,AAA) and ![alt](https://cdn.example.com/out.png)",
        },
      },
    ],
  };

  assert.deepEqual(extractImageOutputs(response), [
    { kind: "data-uri", mimeType: "image/png", value: "data:image/png;base64,AAA" },
    { kind: "url", value: "https://cdn.example.com/out.png" },
  ]);
});

test("resolveConfig requires HIAPI_API_KEY and normalizes base URL", () => {
  assert.throws(
    () => resolveConfig({}),
    /Get one at https:\/\/www\.hiapi\.ai\/en\/register/,
  );

  assert.deepEqual(
    resolveConfig({
      HIAPI_API_KEY: "test-key",
      HIAPI_BASE_URL: "https://api.hiapi.ai/",
    }),
    {
      apiKey: "test-key",
      baseUrl: "https://api.hiapi.ai",
    },
  );
});

test("buildHttpErrorMessage guides users to configure a HiAPI API key", () => {
  const message = buildHttpErrorMessage(401, {
    error: { message: "Invalid API key" },
  });

  assert.match(message, /HTTP 401/);
  assert.match(message, /API key/);
  assert.match(message, /https:\/\/www\.hiapi\.ai\/en\/register/);
});

test("buildHttpErrorMessage guides users to add credits when balance is insufficient", () => {
  const message = buildHttpErrorMessage(402, {
    error: { message: "insufficient balance" },
  });

  assert.match(message, /HTTP 402/);
  assert.match(message, /balance|credits/i);
  assert.match(message, /https:\/\/www\.hiapi\.ai\/en\/dashboard/);
});

test("buildHttpErrorMessage handles rate limits and content policy errors", () => {
  assert.match(
    buildHttpErrorMessage(429, { error: { message: "Too many requests" } }),
    /wait and retry/i,
  );

  assert.match(
    buildHttpErrorMessage(400, {
      error: { message: "content_policy_violation" },
    }),
    /revise the prompt/i,
  );
});

test("compares semver-like skill versions", () => {
  assert.equal(compareVersions("0.1.0", "0.1.0"), 0);
  assert.equal(compareVersions("0.2.0", "0.1.9"), 1);
  assert.equal(compareVersions("0.1.0", "0.2.0"), -1);
});

test("checks skill update policy without affecting current versions", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({
    skills: [{
      id: "hiapi-gpt-image-2",
      version: "0.1.0",
      updatePolicy: {
        latestVersion: "0.1.0",
        minimumVersion: "0.1.0",
        updateCommand: "npx -y github:HiAPIAI/hiapi-gpt-image-2-skill -y",
        notice: "New version available.",
        requiredNotice: "Update required.",
      },
    }],
  }), { status: 200 });

  assert.equal((await checkSkillUpdate({ fetchImpl })).status, "current");
});

test("reports soft and required skill updates from the manifest", async () => {
  const manifest = {
    skills: [{
      id: "hiapi-gpt-image-2",
      version: "0.3.0",
      updatePolicy: {
        latestVersion: "0.3.0",
        minimumVersion: "0.2.0",
        updateCommand: "npx -y github:HiAPIAI/hiapi-gpt-image-2-skill -y",
        notice: "New version available.",
        requiredNotice: "Update required.",
      },
    }],
  };
  const fetchImpl = async () => new Response(JSON.stringify(manifest), { status: 200 });

  const required = await checkSkillUpdate({ currentVersion: "0.1.0", fetchImpl });
  assert.equal(required.status, "required");
  assert.match(required.message, /Update required/);
  assert.match(required.message, /Update now: npx -y github:HiAPIAI\/hiapi-gpt-image-2-skill -y/);

  const available = await checkSkillUpdate({ currentVersion: "0.2.0", fetchImpl });
  assert.equal(available.status, "available");
  assert.match(available.message, /New version available/);
});

test("enforces documented cross-field constraints for the base models", () => {
  assert.throws(
    () => buildImagePayload({ prompt: "p", aspectRatio: "auto", resolution: "2K" }),
    /aspect_ratio "auto" only supports resolution "1K"/,
  );
  assert.throws(
    () => buildImagePayload({ prompt: "p", aspectRatio: "1:1", resolution: "4K" }),
    /cannot be combined with resolution "4K"/,
  );
  assert.throws(
    () => buildImagePayload({
      model: "gpt-image-2/image-to-image",
      prompt: "p",
      inputUrls: ["https://example.com/a.png"],
      aspectRatio: "auto",
      resolution: "4K",
    }),
    /aspect_ratio "auto" only supports resolution "1K"/,
  );

  // Allowed combinations still pass.
  assert.equal(buildImagePayload({ prompt: "p", aspectRatio: "auto", resolution: "1K" }).input.resolution, "1K");
  assert.equal(buildImagePayload({ prompt: "p", aspectRatio: "1:1", resolution: "2K" }).input.resolution, "2K");
  assert.equal(buildImagePayload({ prompt: "p", aspectRatio: "16:9", resolution: "4K" }).input.resolution, "4K");
  assert.equal(
    buildImagePayload({
      model: "gpt-image-2/image-to-image",
      prompt: "p",
      inputUrls: ["https://example.com/a.png"],
      aspectRatio: "16:9",
      resolution: "2K",
    }).input.resolution,
    "2K",
  );
});

test("accepts up to 16 image-to-image references", () => {
  const payload = buildImagePayload({
    model: "gpt-image-2/image-to-image",
    prompt: "p",
    inputUrls: Array.from({ length: 16 }, (_, index) => `https://example.com/${index}.png`),
  });
  assert.equal(payload.input.input_urls.length, 16);
});

test("enforces the documented 2K and 4K aspect ratio gaps on the default route", () => {
  for (const aspectRatio of ["5:4", "4:5", "3:1", "1:3", "9:21"]) {
    assert.throws(
      () => buildImagePayload({ prompt: "p", aspectRatio, resolution: "2K" }),
      /cannot be combined with resolution "2K"/,
    );
    assert.equal(buildImagePayload({ prompt: "p", aspectRatio, resolution: "1K" }).input.aspect_ratio, aspectRatio);
  }
  for (const aspectRatio of ["1:1", "3:1", "1:3", "9:21"]) {
    assert.throws(
      () => buildImagePayload({ prompt: "p", aspectRatio, resolution: "4K" }),
      /cannot be combined with resolution "4K"/,
    );
  }
  for (const aspectRatio of ["5:4", "4:5", "21:9"]) {
    assert.equal(buildImagePayload({ prompt: "p", aspectRatio, resolution: "4K" }).input.resolution, "4K");
  }
});

test("background is optional, validated, and limited to 1K", () => {
  assert.equal(normalizeBackground(undefined), undefined);
  assert.equal(normalizeBackground("Transparent"), "transparent");
  assert.throws(() => normalizeBackground("blur"), /Unsupported background/);

  const withoutBackground = buildImagePayload({ prompt: "p" });
  assert.equal("background" in withoutBackground.input, false);

  const transparent = buildImagePayload({ prompt: "p", aspectRatio: "1:1", resolution: "1K", background: "transparent" });
  assert.equal(transparent.input.background, "transparent");

  assert.throws(
    () => buildImagePayload({ prompt: "p", aspectRatio: "16:9", resolution: "2K", background: "opaque" }),
    /background "opaque" only supports resolution "1K"/,
  );
});

test("parseArgs reads --background and omits it when absent", () => {
  assert.equal(parseArgs(["--prompt", "p"]).background, undefined);
  assert.equal(parseArgs(["--prompt", "p", "--background", "transparent"]).background, "transparent");
});

test("omits storage by default and adds persistent only when requested", () => {
  // Default: no storage field at all (temp is the implicit API default).
  const temp = buildImagePayload({ prompt: "p" });
  assert.equal("storage" in temp, false);

  // Explicit temp also stays implicit.
  assert.equal("storage" in buildImagePayload({ prompt: "p", storage: "temp" }), false);

  // Persistent surfaces as a top-level field (sibling of model/input).
  const persistent = buildImagePayload({ prompt: "p", storage: "persistent" });
  assert.equal(persistent.storage, "persistent");
  assert.equal("storage" in persistent.input, false);

  // Case-insensitive, and invalid values are rejected with cost guidance.
  assert.equal(buildImagePayload({ prompt: "p", storage: "PERSISTENT" }).storage, "persistent");
  assert.equal(normalizeStorage("Persistent"), "persistent");
  assert.throws(() => normalizeStorage("forever"), /Unsupported storage/);
  assert.throws(() => buildImagePayload({ prompt: "p", storage: "forever" }), /Unsupported storage/);

  // undefined (flag omitted) falls back to temp; empty string / null are explicit
  // invalid input and must throw rather than silently coercing to "temp".
  assert.equal(normalizeStorage(undefined), "temp");
  assert.equal("storage" in buildImagePayload({ prompt: "p", storage: undefined }), false);
  assert.throws(() => normalizeStorage(""), /Unsupported storage/);
  assert.throws(() => normalizeStorage(null), /Unsupported storage/);
  assert.throws(() => buildImagePayload({ prompt: "p", storage: "" }), /Unsupported storage/);
  assert.throws(() => buildImagePayload({ prompt: "p", storage: "  " }), /Unsupported storage/);
});

test("parseArgs reads --storage and omits it when absent", () => {
  assert.equal(parseArgs(["--prompt", "p", "--storage", "persistent"]).storage, "persistent");
  assert.equal(parseArgs(["--prompt", "p", "--storage", "temp"]).storage, "temp");
  assert.equal("storage" in parseArgs(["--prompt", "p"]), false);
});

test("modelFileSlug strips the slash from the new model id", () => {
  assert.equal(modelFileSlug("gpt-image-2/text-to-image"), "gpt-image-2-text-to-image");
  assert.equal(modelFileSlug("gpt-image-2/image-to-image"), "gpt-image-2-image-to-image");
});

test("saveImageOutputs writes data URIs to files whose names contain no slash", async () => {
  const outputDir = await mkdtemp(path.join(tmpdir(), "hiapi-gpt-image-2-"));
  try {
    const saved = await saveImageOutputs(
      [{ kind: "data-uri", mimeType: "image/png", value: "data:image/png;base64,AAA" }],
      { outputDir },
    );

    assert.equal(saved.length, 1);
    assert.equal(saved[0].kind, "file");
    const fileName = path.basename(saved[0].path);
    assert.ok(fileName.startsWith("gpt-image-2-text-to-image-"), `unexpected file name: ${fileName}`);
    assert.ok(!fileName.includes("/"), "saved file name must not contain a slash");

    const files = await readdir(outputDir);
    assert.equal(files.length, 1);
    assert.ok(!files[0].includes("/"));
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test("image-to-image allows 1:1 at 4K on the default route, text-to-image does not", () => {
  const i2i = { model: "gpt-image-2/image-to-image", prompt: "p", inputUrls: ["https://example.com/a.png"] };
  assert.equal(buildImagePayload({ ...i2i, aspectRatio: "1:1", resolution: "4K" }).input.resolution, "4K");
  assert.throws(() => buildImagePayload({ ...i2i, aspectRatio: "9:21", resolution: "4K" }), /cannot be combined with resolution "4K"/);
  assert.throws(() => buildImagePayload({ prompt: "p", aspectRatio: "1:1", resolution: "4K" }), /--route ext/);
});

test("default route omits route from the payload", () => {
  assert.equal("route" in buildImagePayload({ prompt: "p", route: "default" }), false);
});

test("beta route sends size only and is text-to-image only", () => {
  assert.deepEqual(buildImagePayload({ prompt: "p", route: "beta", size: "1536x1024" }), {
    model: "gpt-image-2/text-to-image",
    route: "beta",
    input: { prompt: "p", size: "1536x1024" },
  });
  assert.equal(buildImagePayload({ prompt: "p", route: "beta" }).input.size, "auto");
  assert.throws(() => buildImagePayload({ prompt: "p", route: "beta", size: "1024X1024" }), /Unsupported size/);
  assert.throws(() => buildImagePayload({ prompt: "p", route: "beta", aspectRatio: "16:9" }), /not accepted on the beta route/);
  assert.throws(
    () => buildImagePayload({ model: "gpt-image-2/image-to-image", prompt: "p", route: "beta", inputUrls: ["https://e.com/a.png"] }),
    /only available for gpt-image-2\/text-to-image/,
  );
});

test("ext route requires quality, allows every ratio at 4K, and uses image_urls 1-6", () => {
  assert.deepEqual(buildImagePayload({ prompt: "p", route: "ext" }), {
    model: "gpt-image-2/text-to-image",
    route: "ext",
    input: { prompt: "p", aspect_ratio: "1:1", resolution: "1K", quality: "low" },
  });
  assert.equal(buildImagePayload({ prompt: "p", route: "ext", aspectRatio: "9:21", resolution: "4K", quality: "high" }).input.resolution, "4K");
  const i2i = buildImagePayload({
    model: "gpt-image-2/image-to-image",
    prompt: "p",
    route: "ext",
    inputUrls: ["https://e.com/a.png"],
    quality: "medium",
  });
  assert.deepEqual(i2i.input, { prompt: "p", image_urls: ["https://e.com/a.png"], aspect_ratio: "auto", resolution: "1K", quality: "medium" });
  assert.throws(
    () => buildImagePayload({ model: "gpt-image-2/image-to-image", prompt: "p", route: "ext", inputUrls: Array(7).fill("https://e.com/a.png") }),
    /requires 1-6 input image URLs via image_urls/,
  );
  assert.throws(() => buildImagePayload({ prompt: "p", route: "ext", background: "transparent" }), /not accepted on the ext route/);
  assert.throws(() => buildImagePayload({ prompt: "p", route: "ext", quality: "ultra" }), /Unsupported quality/);
});

test("--quality and --size are rejected outside their routes", () => {
  assert.throws(() => buildImagePayload({ prompt: "p", quality: "high" }), /only accepted on the ext route/);
  assert.throws(() => buildImagePayload({ prompt: "p", size: "1024x1024" }), /only accepted on the beta route/);
  assert.throws(() => buildImagePayload({ prompt: "p", route: "pro" }), /Unsupported route/);
});

test("createImageTask sends the Idempotency-Key header when given", async () => {
  let headers = {};
  const fetchImpl = async (_url, init) => {
    headers = init.headers;
    return new Response(JSON.stringify({ data: { taskId: "tk-1" } }), { status: 200 });
  };
  await createImageTask(buildImagePayload({ prompt: "p" }), {
    config: { apiKey: "k", baseUrl: "https://api.hiapi.ai" },
    fetchImpl,
    idempotencyKey: "key-1",
  });
  assert.equal(headers["Idempotency-Key"], "key-1");
  assert.match(normalizeIdempotencyKey(), /^[0-9a-f-]{36}$/);
  assert.throws(() => normalizeIdempotencyKey("a\nb"), /control characters/);
  assert.throws(() => normalizeIdempotencyKey("x".repeat(256)), /at most 255/);
});

test("fetchPricingEstimate matches routed pricing rows without creating a task", async () => {
  const pricing = {
    data: [
      { model_name: "gpt-image-2/text-to-image", base_usd_value: 0.03, policies: [{ rule: { resolution: { match: "4K" } }, usd_value: 0.06 }] },
      { model_name: "gpt-image-2/text-to-image@ext", base_usd_value: 0.007, policies: [{ rule: { quality: { match: "high" }, resolution: { match: "4K" } }, usd_value: 0.76 }] },
      { model_name: "gpt-image-2/text-to-image@beta", base_usd_value: 0.02, policies: [{ rule: { size: { with: true } }, usd_value: 0.02 }] },
    ],
  };
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    return new Response(JSON.stringify(pricing), { status: 200 });
  };
  const est = (opts) => fetchPricingEstimate(buildImagePayload({ prompt: "p", ...opts }), { fetchImpl, siteUrl: "https://www.hiapi.ai" });
  assert.equal((await est({ aspectRatio: "16:9", resolution: "4K" })).estimatedUsd, 0.06);
  assert.equal((await est({ route: "ext", aspectRatio: "16:9", resolution: "4K", quality: "high" })).pricingModel, "gpt-image-2/text-to-image@ext");
  assert.equal((await est({ route: "ext", aspectRatio: "16:9", resolution: "4K", quality: "high" })).estimatedUsd, 0.76);
  assert.equal((await est({ route: "beta" })).estimatedUsd, 0.02);
  assert.ok(requested.every((url) => url === "https://www.hiapi.ai/api/pricing"));
});

test("parseArgs reads route, recovery, and preflight flags", () => {
  const options = parseArgs(["--prompt", "p", "--route", "ext", "--quality", "high", "--dry-run", "--estimate", "--idempotency-key", "k"]);
  assert.equal(options.route, "ext");
  assert.equal(options.quality, "high");
  assert.equal(options.dryRun, true);
  assert.equal(options.estimate, true);
  assert.equal(options.idempotencyKey, "k");
  assert.equal(parseArgs(["--route", "beta", "--size", "1024x1024"]).size, "1024x1024");
  assert.equal(parseArgs(["--resume-task-id", "tk-1"]).resumeTaskId, "tk-1");
  assert.equal(parseArgs(["--prompt", "p"]).aspectRatio, undefined);
  assert.throws(() => parseArgs(["--resume-task-id", "tk-1", "--dry-run"]), /cannot be combined/);
});
