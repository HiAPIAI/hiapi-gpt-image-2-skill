#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildImagePayload,
  createImageTask,
  extractTaskId,
  resolveConfig,
  saveImageOutputs,
  warnOrRequireSkillUpdate,
  waitForImage,
} from "./lib/gpt-image-2.mjs";

export function parseArgs(argv) {
  const options = {
    aspectRatio: "auto",
    outputDir: "outputs",
  };
  const promptParts = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--model") {
      options.model = argv[++i];
    } else if (arg === "--prompt" || arg === "-p") {
      options.prompt = argv[++i];
    } else if (arg === "--aspect-ratio" || arg === "--aspect") {
      options.aspectRatio = argv[++i];
    } else if (arg === "--resolution") {
      options.resolution = argv[++i];
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

  return options;
}

function printHelp() {
  console.log(`Usage:
  hiapi-gpt-image-2 --prompt "Create a product poster" --aspect-ratio 16:9

Options:
      --model           gpt-image-2/text-to-image or gpt-image-2/image-to-image.
                        Default: gpt-image-2/text-to-image
  -p, --prompt          Image prompt. Positional prompt text is also accepted.
      --aspect-ratio    auto, 1:1, 3:2, 2:3, 4:3, 3:4, 5:4, 4:5,
                        16:9, 9:16, 2:1, 1:2, 3:1, 1:3, 21:9, or 9:21.
                        Default: auto
      --resolution      1K, 2K, or 4K. Default: 1K
      --input-url       Repeatable. Required 1-5 times for image-to-image models.
  -o, --output-dir      Directory for generated image files. Default: outputs
      --storage         temp or persistent. Default: temp (free, expires ~7 days).
                        "persistent" keeps the output long-term and is BILLED
                        ($0.05/GB·month). See https://docs.hiapi.ai/storage/
      --no-save         Return remote URLs or data URIs without writing files
      --no-wait         Create the task and return the task id
  -h, --help            Show this help

Environment:
  HIAPI_API_KEY         Required HiAPI API key
  HIAPI_BASE_URL        Optional, defaults to https://api.hiapi.ai`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  await warnOrRequireSkillUpdate();

  const config = resolveConfig();
  const payload = buildImagePayload({
    model: options.model,
    prompt: options.prompt,
    aspectRatio: options.aspectRatio,
    resolution: options.resolution,
    inputUrls: options.inputUrls,
    storage: options.storage,
  });

  // Persistent storage costs money; warn on stderr so stdout stays clean JSON.
  if (payload.storage === "persistent") {
    console.error(
      'Note: --storage persistent keeps this output beyond ~7 days and is billed at $0.05/GB·month (charged daily). Delete it to stop charges. See https://docs.hiapi.ai/storage/',
    );
  }

  const created = await createImageTask(payload, { config });
  const taskId = extractTaskId(created);
  if (!taskId) {
    throw new Error(`No image task id returned: ${JSON.stringify(created)}`);
  }

  if (options.wait === false) {
    console.log(
      JSON.stringify(
        {
          model: payload.model,
          taskId,
          status: "created",
          aspectRatio: payload.input.aspect_ratio,
          resolution: payload.input.resolution,
          storage: payload.storage ?? "temp",
          outputs: [],
        },
        null,
        2,
      ),
    );
    return;
  }

  const { response, outputs } = await waitForImage(taskId, { config });
  const savedOutputs = options.save === false
    ? outputs.map((output) => output.kind === "url"
      ? { kind: "url", url: output.value }
      : { kind: "data-uri", value: output.value, mimeType: output.mimeType })
    : await saveImageOutputs(outputs, {
      outputDir: path.resolve(process.cwd(), options.outputDir),
    });

  console.log(
    JSON.stringify(
      {
        model: payload.model,
        taskId,
        aspectRatio: payload.input.aspect_ratio,
        resolution: payload.input.resolution,
        storage: payload.storage ?? "temp",
        outputs: savedOutputs,
        rawStatus: response,
      },
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
