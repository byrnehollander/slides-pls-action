#!/usr/bin/env bun
/**
 * Build wrapper for Slidev that handles Vue compiler errors gracefully.
 * If the initial build fails due to HTML issues, applies aggressive sanitization and retries.
 */
import { spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { stripHtmlFallback } from "./sanitize.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const slidesPath = join(__dirname, "slides.md");

function runBuild() {
  console.log("Attempting Slidev build...");
  const result = spawnSync("bun", ["run", "slidev", "build", "--out", "dist", "--base", "/"], {
    cwd: __dirname,
    stdio: "pipe",
    encoding: "utf-8",
  });

  return {
    success: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function extractErrorLine(stderr) {
  // Try to extract the problematic line number from Vue compiler error
  const lineMatch = stderr.match(/\.md[^:]*:(\d+):\d+/);
  if (lineMatch) {
    return parseInt(lineMatch[1], 10);
  }
  return null;
}

async function main() {
  // First attempt: Try building with current content
  console.log("\n=== Build Attempt 1: Normal build ===");
  let result = runBuild();

  if (result.success) {
    console.log("Build succeeded on first attempt!");
    process.exit(0);
  }

  console.log("First build failed. Analyzing error...");
  console.log("STDERR:", result.stderr.slice(0, 1000));

  const errorLine = extractErrorLine(result.stderr);
  if (errorLine) {
    console.log(`Error appears to be around line ${errorLine}`);

    // Read the slides and show context around the error
    const slides = readFileSync(slidesPath, "utf-8");
    const lines = slides.split("\n");
    const start = Math.max(0, errorLine - 5);
    const end = Math.min(lines.length, errorLine + 5);

    console.log("\n=== Error context ===");
    for (let i = start; i < end; i++) {
      const marker = i + 1 === errorLine ? ">>> " : "    ";
      console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
    console.log("=== End context ===\n");
  }

  // Second attempt: Apply aggressive HTML stripping
  console.log("\n=== Build Attempt 2: Stripped HTML fallback ===");
  const originalContent = readFileSync(slidesPath, "utf-8");
  const strippedContent = stripHtmlFallback(originalContent);

  // Write stripped version
  writeFileSync(slidesPath, strippedContent);
  console.log("Applied HTML stripping fallback");

  result = runBuild();

  if (result.success) {
    console.log("Build succeeded with stripped HTML!");
    console.log("NOTE: Some formatting may be lost due to HTML stripping");
    process.exit(0);
  }

  console.log("Stripped build also failed. Error:");
  console.log(result.stderr.slice(0, 2000));

  // Third attempt: Ultra-minimal slides
  console.log("\n=== Build Attempt 3: Minimal fallback ===");
  const minimalSlides = `---
theme: default
colorSchema: dark
favicon: 'https://fav.farm/⚠️'
title: PR Review - Build Error
layout: cover
---

# Slide Generation Error

The presentation could not be generated due to a build error.

---

## What Happened

The AI-generated content contained HTML that could not be compiled by Slidev.

**Error excerpt:**
\`\`\`
${result.stderr.slice(0, 500).replace(/`/g, "'")}
\`\`\`

---

## Next Steps

1. Check the GitHub Actions logs for details
2. Try regenerating with simpler instructions
3. Contact the repository maintainers if the issue persists
`;

  writeFileSync(slidesPath, minimalSlides);
  console.log("Wrote minimal fallback slides");

  result = runBuild();

  if (result.success) {
    console.log("Build succeeded with minimal fallback");
    process.exit(0);
  }

  // If even minimal fails, something is very wrong
  console.error("All build attempts failed!");
  console.error(result.stderr);
  process.exit(1);
}

main().catch((err) => {
  console.error("Build script error:", err);
  process.exit(1);
});
