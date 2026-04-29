import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildChatPayload,
  buildHttpErrorMessage,
  extractImageOutputs,
  normalizeAspectRatio,
  resolveConfig,
} from "../scripts/lib/gpt-image-2.mjs";

test("builds the HiAPI chat-completions payload for gpt-image-2", () => {
  const payload = buildChatPayload({
    prompt: "Create a product poster",
    aspectRatio: "16:9",
  });

  assert.equal(payload.model, "gpt-image-2");
  assert.equal(payload.stream, false);
  assert.deepEqual(payload.messages, [
    { role: "user", content: "Create a product poster" },
  ]);
  assert.equal(
    payload.extra_body.google.image_config.aspect_ratio,
    "16:9",
  );
});

test("rejects unsupported aspect ratios before sending a request", () => {
  assert.throws(
    () => normalizeAspectRatio("2:1"),
    /Unsupported aspect ratio/,
  );
});

test("extracts data-uri and URL images from chat markdown content", () => {
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
    /Get one at https:\/\/www\.hiapi\.ai\/en\/dashboard\/api-keys/,
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
  assert.match(message, /https:\/\/www\.hiapi\.ai\/en\/dashboard\/api-keys/);
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
