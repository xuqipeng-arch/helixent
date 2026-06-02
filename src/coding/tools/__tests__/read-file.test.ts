import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { readFileTool } from "../read-file";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "helixent-read-file-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("readFileTool", () => {
  test("returns numbered lines for whole-file reads", async () => {
    const filePath = join(tempDir, "demo.txt");
    await writeFile(filePath, "a\nb\n");

    const result = await readFileTool.invoke({
      description: "Read the whole file",
      path: filePath,
    });

    expect(result).toBe("1: a\n2: b");
  });

  test("returns empty string for empty files", async () => {
    const filePath = join(tempDir, "empty.txt");
    await writeFile(filePath, "");

    const result = await readFileTool.invoke({
      description: "Read empty file",
      path: filePath,
    });

    expect(result).toBe("");
  });

  test("returns numbered lines for ranged reads", async () => {
    const filePath = join(tempDir, "demo.txt");
    await writeFile(filePath, "first\nsecond\nthird\n");

    const result = await readFileTool.invoke({
      description: "Read a range",
      path: filePath,
      startLine: 2,
      endLine: 3,
    });

    expect(result).toBe("2: second\n3: third");
  });

  test("left-pads line numbers based on total file lines", async () => {
    const filePath = join(tempDir, "padded.txt");
    const content = Array.from({ length: 12 }, (_, i) => `line${i + 1}`).join("\n");
    await writeFile(filePath, content);

    const result = await readFileTool.invoke({
      description: "Read padded file",
      path: filePath,
      startLine: 1,
      endLine: 2,
    });

    expect(result).toBe(" 1: line1\n 2: line2");
  });

  test("returns structured error for invalid range", async () => {
    const filePath = join(tempDir, "demo.txt");
    await writeFile(filePath, "first\nsecond\n");

    const result = await readFileTool.invoke({
      description: "Bad range",
      path: filePath,
      startLine: 3,
      endLine: 1,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "INVALID_RANGE",
    });
  });

  test("returns structured error when file is missing", async () => {
    const filePath = join(tempDir, "missing.txt");
    const result = await readFileTool.invoke({
      description: "Missing file",
      path: filePath,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "FILE_NOT_FOUND",
    });
  });
});
