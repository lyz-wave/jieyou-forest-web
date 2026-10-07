import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 全项目不再使用 emoji：动物标记用迷你真纸偶（PuppetMark），
 * 叶子、羽毛这类点缀用纸片图形（PaperGlyph）。
 * 允许保留的排版符号：勾与叉（✓ ✕），它们随字色走，不算 emoji。
 */
const ROOTS = ["components", "app", "lib"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "mark-sample"]);
const ALLOWED = new Set(["✓", "✕"]);
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return SKIP_DIRS.has(name) ? [] : sourceFiles(path);
    if (!/\.(ts|tsx)$/.test(name)) return [];
    if (/\.test\.(ts|tsx)$/.test(name)) return [];
    return [path];
  });
}

describe("界面里不再出现 emoji", () => {
  it("components / app / lib 的产品源码里一个 emoji 都没有", () => {
    const found: string[] = [];
    for (const dir of ROOTS) {
      for (const file of sourceFiles(dir)) {
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            for (const ch of line) {
              if (EMOJI.test(ch) && !ALLOWED.has(ch)) found.push(`${file}:${i + 1} 「${ch}」 ${line.trim().slice(0, 60)}`);
            }
          });
      }
    }
    expect(found, `应当没有 emoji，却找到了：\n${found.join("\n")}`).toEqual([]);
  });
});
