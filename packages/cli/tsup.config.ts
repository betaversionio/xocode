import { defineConfig } from "tsup";
import pkg from "./package.json";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  dts: false,
  clean: true,
  sourcemap: false,
  // Bundle @xo/core (workspace package) and all other deps into a single file
  noExternal: [/^@xo\//, "commander", "chalk", "ora", "fs-extra", "yaml", "prompts", "handlebars", "ts-morph"],
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
  banner: {
    js: "#!/usr/bin/env node",
  },
});
