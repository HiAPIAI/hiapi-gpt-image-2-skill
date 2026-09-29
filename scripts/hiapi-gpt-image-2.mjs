#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildImagePayload,
  createImageTask,
  describePayload,
  extractTaskId,
  fetchPricingEstimate,
  normalizeIdempotencyKey,
  resolveConfig,
  saveImageOutputs,
  warnOrRequireSkillUpdate,
  waitForImage,
} from "./lib/gpt-image-2.mjs";

export function parseArgs(argv) {
  const options = {
    outputDir: "outputs",
  };
  const promptParts = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--model") {
      options.model = argv[++i];
    } else if (arg === "--route") {
      options.route = argv[++i];
    } else if (arg === "--quality") {
      options.quality = argv[++i];
    } else if (arg === "--size") {
      options.size = argv[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--estimate") {
      options.estimate = true;
    } else if (arg === "--idempotency-key") {
      options.idempotencyKey = argv[++i];
    } else if (arg === "--resume-task-id") {
      options.resumeTaskId = argv[++i];
    } else if (arg === "--prompt" || arg === "-p") {
      options.prompt = argv[++i];
    } else if (arg === "--aspect-ratio" || arg === "--aspect") {
      options.aspectRatio = argv[++i];
    } else if (arg === "--resolution") {
      options.resolution = argv[++i];
    } else if (arg === "--background") {
      options.background = argv[++i];
    } else if (arg === "--input-url" || arg === "--input-urls" || arg === "--input-image-url") {
      if (!options.inputUrls) options.inputUrls = [];
      options.inputUrls.push(argv[++i]);
    } else if (arg === "--output-dir" || arg === "-o") {
      options.outputDir = argv[++i];
    } else if (arg === "--storage") {
      options.storage = argv[++i];
    } else if (arg === "--no-save") {
      options.save = false;
    } else if (arg === "--no-wait") {
      options.wait = false;
    } else if (arg?.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      promptParts.push(arg);
    }
  }

  if (!options.prompt && promptParts.length > 0) {
    options.prompt = promptParts.join(" ");
  }
  if (options.resumeTaskId !== undefined && !String(options.resumeTaskId).trim()) {
    throw new Error("--resume-task-id requires a task ID.");
  }
  if (options.resumeTaskId && (options.dryRun || options.estimate)) {
    throw new Error("--resume-task-id cannot be combined with --dry-run or --estimate.");
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  hiapi-gpt-image-2 --prompt "Create a product poster" --aspect-ratio 16:9
  hiapi-gpt-image-2 --prompt "..." --dry-run --estimate      # validate + price, no task
  hiapi-gpt-image-2 --resume-task-id <task-id>               # recover, no new task

Options:
      --model           gpt-image-2/text-to-image or gpt-image-2/image-to-image.
                        Default: gpt-image-2/text-to-image
      --route           default, beta (text-to-image only), or ext. Default: default
  -p, --prompt          Image prompt. Positional prompt text is also accepted.
      --aspect-ratio    auto, 1:1, 3:2, 2:3, 4:3, 3:4, 5:4, 4:5,
                        16:9, 9:16, 2:1, 1:2, 3:1, 1:3, 21:9, or 9:21.
                        Default: auto (ext text-to-image: 1:1). Not used on beta.
      --resolution      1K, 2K, or 4K. Default: 1K. Not used on beta.
                        default route: auto aspect ratio and --background require 1K;
                        2K excludes 5:4, 4:5, 3:1, 1:3, 9:21;
                        4K excludes 3:1, 1:3, 9:21 (text-to-image also 1:1).
                        ext route: every aspect ratio at 1K/2K/4K.
      --quality         ext only: low, medium, or high. Default: low
      --size            beta only: auto or WIDTHxHEIGHT such as 1024x1024. Default: auto
      --background      default route only: auto, opaque, or transparent (1K only).
      --input-url       Repeatable. Image-to-image needs 1-16 (default) or 1-6 (ext).
  -o, --output-dir      Directory for generated image files. Default: outputs
      --storage         temp or persistent. Default: temp (free, expires ~7 days).
                        "persistent" keeps the output long-term and is BILLED
                        ($0.05/GB·month). See https://docs.hiapi.ai/storage/
      --dry-run         Validate and print the payload. No API key, no task.
      --estimate        Print a public pricing snapshot for the payload. No task.
      --idempotency-key Reuse a key to retry a create safely. Auto-generated if omitted.
      --resume-task-id  Poll and download an existing task without creating a new one.
      --no-save         Return remote URLs or data URIs without writing files
      --no-wait         Create the task and return the task id
  -h, --help            Show this help

Environment:
  HIAPI_API_KEY         Required HiAPI API key (not needed for --dry-run/--estimate)
  HIAPI_BASE_URL        Optional, defaults to https://api.hiapi.ai`);
}

function formatOutputs(outputs, options) {
  return options.save === false
    ? outputs.map((output) => output.kind === "url"
      ? { kind: "url", url: output.value }
      : { kind: "data-uri", value: output.value, mimeType: output.mimeType })
    : saveImageOutputs(outputs, {
      outputDir: path.resolve(process.cwd(), options.outputDir),
    });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  // Recovery of an already-created task never creates or bills anything, so it runs
  // even when a hard upgrade is pending.
  if (options.resumeTaskId) {
    const config = resolveConfig();
    const taskId = String(options.resumeTaskId).trim();
    const { response, outputs } = await waitForImage(taskId, { config });
    console.log(JSON.stringify({ taskId, resumed: true, outputs: await formatOutputs(outputs, options), rawStatus: response }, null, 2));
    return;
  }

  const payload = buildImagePayload({
    model: options.model,
    route: options.route,
    prompt: options.prompt,
    aspectRatio: options.aspectRatio,
    resolution: options.resolution,
    inputUrls: options.inputUrls,
    background: options.background,
    quality: options.quality,
    size: options.size,
    storage: options.storage,
  });

  if (options.dryRun || options.estimate) {
    const estimate = options.estimate ? await fetchPricingEstimate(payload) : undefined;
    console.log(
      JSON.stringify(
        {
          paidTaskCreated: false,
          payload,
          ...(estimate ? { estimate } : {}),
          next: "Review the payload, then remove --dry-run/--estimate to create the paid task.",
        },
        null,
        2,
      ),
    );
    return;
  }

  await warnOrRequireSkillUpdate();

  const config = resolveConfig();
  const idempotencyKey = normalizeIdempotencyKey(options.idempotencyKey);

  // Persistent storage costs money; warn on stderr so stdout stays clean JSON.
  if (payload.storage === "persistent") {
    console.error(
      'Note: --storage persistent keeps this output beyond ~7 days and is billed at $0.05/GB·month (charged daily). Delete it to stop charges. See https://docs.hiapi.ai/storage/',
    );
  }

  console.error(`HiAPI idempotency key: ${idempotencyKey}`);
  let created;
  try {
    created = await createImageTask(payload, { config, idempotencyKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}\nIf acceptance is unclear, retry with --idempotency-key ${idempotencyKey}; do not create a new task blindly.`);
  }
  const taskId = extractTaskId(created);
  if (!taskId) {
    throw new Error(`No image task id returned; task acceptance is unknown. Retry with --idempotency-key ${idempotencyKey}. Response: ${JSON.stringify(created)}`);
  }
  console.error(`HiAPI task ID: ${taskId} (recover with --resume-task-id ${taskId})`);

  if (options.wait === false) {
    console.log(JSON.stringify({ ...describePayload(payload), taskId, idempotencyKey, status: "created", outputs: [] }, null, 2));
    return;
  }

  const { response, outputs } = await waitForImage(taskId, { config });
  console.log(
    JSON.stringify(
      { ...describePayload(payload), taskId, idempotencyKey, outputs: await formatOutputs(outputs, options), rawStatus: response },
      null,
      2,
    ),
  );
}

// Only run the CLI when executed directly, not when imported (e.g. by tests).
// Compare real paths so a symlinked bin (npm/npx wires bins as symlinks into
// node_modules/.bin) still resolves to this module and runs main().
function isInvokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  const modulePath = fileURLToPath(import.meta.url);
  try {
    if (realpathSync(entry) === modulePath) return true;
  } catch {
    // entry may not exist on disk (e.g. a virtual wrapper); fall through.
  }
  // Fallback: tolerate a missing extension on the invoked path (some shims drop it).
  return entry === modulePath || `${entry}.mjs` === modulePath;
}

if (isInvokedDirectly()) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
