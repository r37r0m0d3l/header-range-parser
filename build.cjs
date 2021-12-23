const esbuild = require("esbuild");
const { Generator } = require("npm-dts");

const { dependencies, peerDependencies } = require("./package.json");

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
  external: Object.keys(dependencies || {}).concat(Object.keys(peerDependencies || {})),
  minify: true,
  outdir: "./dist/",
  platform: "neutral",
  sourcemap: "external",
  target: "node12.22.0",
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
      .build({ ...buildOptions, ...{ format: "esm", outExtension: { ".js": ".js" } } })
      .then(() => {
        console.log("   🟣 ESM build completed             ✔️");
        resolve();
      })
      .catch((error) => {
        console.warn(error);
        process.exit(1);
      });
  });
}

async function cjs() {
  return new Promise((resolve) => {
    esbuild
      .build({ ...buildOptions, ...{ format: "cjs", outExtension: { ".js": ".cjs" } } })
      .then(() => {
        console.log("   🟢 CommonJS build completed        ✔️");
        resolve();
      })
      .catch((error) => {
        console.warn(error);
        process.exit(2);
      });
  });
}

async function dts() {
  return new Promise((resolve) => {
    new Generator({
      entry: "./src/index.ts",
      output: "./dist/index.d.ts",
    })
      .generate()
      .then(() => {
        console.log("   🔵 TS declarations build completed ✔️");
        resolve();
      })
      .catch((error) => {
        console.warn(error);
        process.exit(3);
      });
  });
}

async function start() {
  return new Promise((resolve) => {
    console.clear();
    console.log("🏁 Build started…");
    resolve();
  });
}

Promise.all([start(), mjs(), cjs(), dts()])
  .then(() => {
    console.log("✅ Build completed");
    process.exit(0);
  })
  .catch((error) => {
    console.warn(error);
    process.exit(4);
  });
