#!/usr/bin/env node
import path from "node:path";

import {
  buildChatPayload,
  callHiApi,
  extractImageOutputs,
  MODEL,
  resolveConfig,
  saveImageOutputs,
} from "./lib/gpt-image-2.mjs";

function parseArgs(argv) {
  const options = {
    aspectRatio: "1:1",
    outputDir: "outputs",
  };
  const promptParts = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--prompt" || arg === "-p") {
      options.prompt = argv[++i];
    } else if (arg === "--aspect-ratio" || arg === "--aspect") {
      options.aspectRatio = argv[++i];
    } else if (arg === "--output-dir" || arg === "-o") {
      options.outputDir = argv[++i];
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
  -p, --prompt          Image prompt. Positional prompt text is also accepted.
      --aspect-ratio    auto, 1:1, 16:9, 9:16, 4:3, or 3:4. Default: 1:1
  -o, --output-dir      Directory for generated image files. Default: outputs
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

  const config = resolveConfig();
  const payload = buildChatPayload({
    prompt: options.prompt,
    aspectRatio: options.aspectRatio,
  });

  const response = await callHiApi({ config, payload });
  const imageOutputs = extractImageOutputs(response);
  if (imageOutputs.length === 0) {
    throw new Error("HiAPI response did not contain an extractable Markdown image.");
  }

  const savedOutputs = await saveImageOutputs(imageOutputs, {
    outputDir: path.resolve(process.cwd(), options.outputDir),
  });

  console.log(
    JSON.stringify(
      {
        model: MODEL,
        aspectRatio: payload.extra_body.google.image_config.aspect_ratio,
        outputs: savedOutputs,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
