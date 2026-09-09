import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";
import ts from "typescript";

export async function loadTsModule(path, mocks = {}) {
  const cache = new Map();
  async function load(path) {
    if (cache.has(path)) return cache.get(path);
    const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    const mod = new SourceTextModule(ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText);
    cache.set(path, mod);
    await mod.link((specifier) => {
      const values = specifier === "server-only" ? {} : mocks[specifier];
      if (values) return new SyntheticModule(Object.keys(values), function () {
        for (const [key, value] of Object.entries(values)) this.setExport(key, value);
      });
      if (specifier.startsWith("@/")) return load(`${specifier.slice(2)}.ts`);
      throw new Error(`Unexpected test dependency: ${specifier}`);
    });
    return mod;
  }
  const mod = await load(path);
  await mod.evaluate();
  return mod.namespace;
}
