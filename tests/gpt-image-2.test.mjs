import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildImagePayload,
  buildHttpErrorMessage,
  checkSkillUpdate,
  compareVersions,
  createImageTask,
  extractTaskId,
  extractImageOutputs,
  normalizeAspectRatio,
  resolveConfig,
} from "../scripts/lib/gpt-image-2.mjs";

test("builds the HiAPI task payload for gpt-image-2", () => {
  const payload = buildImagePayload({
    prompt: "Create a product poster",
    aspectRatio: "16:9",
    resolution: "1K",
  });

  assert.deepEqual(payload, {
    model: "gpt-image-2",
    input: {
      prompt: "Create a product poster",
      aspect_ratio: "16:9",
      resolution: "1K",
    },
  });
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
