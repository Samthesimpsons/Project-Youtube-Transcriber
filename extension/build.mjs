import * as esbuild from "esbuild";
import fs from "fs";

const watching = process.argv.includes("--watch");

const sharedOptions = {
  bundle: true,
  target: "chrome114",
  minify: !watching,
  sourcemap: watching ? "inline" : false,
};

const entries = [
  { entryPoints: ["src/background.ts"], outfile: "dist/background.js", format: "esm" },
  { entryPoints: ["src/content.ts"],    outfile: "dist/content.js",    format: "iife" },
  { entryPoints: ["src/sidepanel.ts"],  outfile: "dist/sidepanel.js",  format: "iife" },
  { entryPoints: ["src/options.ts"],    outfile: "dist/options.js",    format: "iife" },
];

function copyStatics() {
  fs.mkdirSync("dist", { recursive: true });
  fs.copyFileSync("manifest.json", "dist/manifest.json");

  for (const file of [
    "src/sidepanel.html",
    "src/options.html",
    "src/content.css",
    "src/sidepanel.css",
    "src/options.css",
  ]) {
    fs.copyFileSync(file, `dist/${file.replace("src/", "")}`);
  }
}

if (watching) {
  const contexts = await Promise.all(
    entries.map((entry) => esbuild.context({ ...sharedOptions, ...entry }))
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  copyStatics();
  console.log("Watching for changes...");
} else {
  await Promise.all(entries.map((entry) => esbuild.build({ ...sharedOptions, ...entry })));
  copyStatics();
  console.log("Build complete → dist/");
}
