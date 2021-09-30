const { exec } = require("child_process");

const esbuild = require("esbuild");

const args = new Object(null);

process.argv
  .slice(2)
  .filter((arg) => arg.length > 2)
  .filter((arg) => arg.startsWith("--"))
  .map((arg) => arg.slice(2))
  .forEach((arg) => {
    if (!arg.includes("=")) {
      args[arg] = true;
      return;
    }
    const index = arg.indexOf("=");
    const key = arg.slice(0, index);
    const value = arg.slice(index + 1);
    args[key] = value;
    const check = value.toLowerCase().trim();
    switch (true) {
      case check === "false":
        args[key] = false;
        break;
      case check === "null":
        args[key] = null;
        break;
      case check === "true":
        args[key] = true;
        break;
      case check === "undefined":
        args[key] = undefined;
        break;
      case /\d/.test(check) && Number.isFinite(Number.parseFloat(check)):
        args[key] = Number.parseFloat(check);
        break;
    }
  });

{
  const MINIFY = true;
  args.minify = "minify" in args ? (args.minify === true ? true : args.minify === false ? false : MINIFY) : MINIFY;
}

{
  const SOURCEMAP = "external";
  args.sourcemap =
    "sourcemap" in args
      ? true === args.sourcemap
        ? SOURCEMAP
        : false === args.sourcemap
        ? false
        : SOURCEMAP
      : SOURCEMAP;
}

const buildOptions = {
  bundle: true,
  entryPoints: ["./src/index.ts"],
  minify: true,
  outdir: "./dist/",
  platform: "neutral",
  sourcemap: "external",
  target: "node12.20",
};

if ("minify" in args) {
  buildOptions.minify = args.minify;
  if (buildOptions.minify) {
    buildOptions.sourcemap = args.sourcemap;
  } else {
    buildOptions.sourcemap = false;
  }
}

async function mjs() {
  return new Promise((resolve) => {
    esbuild
      .build({ ...buildOptions, ...{ format: "esm", outExtension: { ".js": ".mjs" } } })
      .then(resolve)
      .catch(() => process.exit(1));
  });
}

async function cjs() {
  return new Promise((resolve) => {
    esbuild
      .build({ ...buildOptions, ...{ format: "cjs", outExtension: { ".js": ".cjs" } } })
      .then(resolve)
      .catch(() => process.exit(2));
  });
}
async function js() {
  return new Promise((resolve) => {
    esbuild
      .build({ ...buildOptions, ...{ format: "iife", outExtension: { ".js": ".js" } } })
      .then(resolve)
      .catch(() => process.exit(3));
  });
}

async function dts() {
  return new Promise((resolve) => {
    exec("node ./node_modules/typescript/lib/tsc --emitDeclarationOnly --outDir ./dist/", (error, stdout, stderr) => {
      if (error) {
        process.exit(4);
      }
      if (stderr) {
        process.exit(5);
      }
      exec("node ./node_modules/prettier/bin-prettier.js --write ./dist/index.d.ts", (error, stdout, stderr) => {
        if (error) {
          process.exit(6);
        }
        if (stderr) {
          process.exit(7);
        }
        resolve();
      });
    });
  });
}

Promise.all([mjs(), cjs(), js(), dts()])
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(8);
  });
