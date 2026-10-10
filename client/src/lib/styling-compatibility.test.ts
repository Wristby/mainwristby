import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { compile } from "@tailwindcss/node";
import { describe, expect, it } from "vitest";
import { legacyColors } from "../styles/legacy-colors";
import { cn } from "./utils";

describe("patched styling compiler compatibility", () => {
  it("still resolves conflicting layout, color and effect classes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("bg-white", "bg-slate-50")).toBe("bg-slate-50");
    expect(cn("shadow-sm", "shadow-md")).toBe("shadow-md");
    expect(cn("outline-none", "focus:ring-2")).toBe("outline-none focus:ring-2");
  });
  it("preserves the existing brand and neutral colors", () => {
    expect(legacyColors.emerald[600]).toBe("#059669");
    expect(legacyColors.slate[950]).toBe("#020617");
    expect(legacyColors.slate[200]).toBe("#e2e8f0");
    expect(legacyColors.amber[800]).toBe("#92400e");
  });
  it("compiles theme colors, legacy effects, responsive utilities, animations and dropdown dimensions", async () => {
    const path = fileURLToPath(new URL("../index.css", import.meta.url));
    const compiler = await compile(await readFile(path, "utf8"), { base: dirname(path), onDependency: () => {} });
    const css = compiler.build([
      "bg-emerald-600", "bg-background", "text-foreground", "border-border",
      "shadow-sm", "outline-none", "bg-gradient-to-r", "md:grid-cols-2",
      "animate-in", "fade-in-0", "dark:bg-slate-950",
      "origin-[var(--radix-select-content-transform-origin)]",
      "max-h-[var(--radix-select-content-available-height)]",
      "bg-[var(--color-bg)]", "border-[var(--color-border)]",
    ]);
    expect(css).toContain("background-color: #059669");
    expect(css).toContain("hsl(var(--background)");
    expect(css).toContain("hsl(var(--foreground)");
    expect(css).toContain("hsl(var(--border)");
    expect(css).toContain("0 1px 2px 0");
    expect(css).toContain("outline: 2px solid transparent !important");
    expect(css).toContain("linear-gradient(to right");
    expect(css).toContain("transform-origin: var(--radix-select-content-transform-origin)");
    expect(css).toContain("max-height: var(--radix-select-content-available-height)");
    expect(css).toContain("background-color: var(--color-bg)");
    expect(css).toContain("border-color: var(--color-border)");
    expect(css).toContain("animation-name: enter");
    expect(css).toContain("grid-template-columns: repeat(2");
    expect(css).toContain(".dark");
  });
});
