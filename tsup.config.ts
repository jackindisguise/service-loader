import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	format: ["esm", "cjs"],
	outDir: "dist",
	target: "node20",
	dts: true,
	sourcemap: true,
	clean: true,
});
