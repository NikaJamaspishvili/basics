#!/usr/bin/env node

const command = process.argv[2];

if (command === "dev") {
  const { dev } = await import("./dev.js");
  await dev();
} else if (command === "build") {
  const { build } = await import("./build.js");
  await build();
} else if (command === "preview") {
  const { preview } = await import("./preview.js");
  await preview();
} else {
  console.log(`
Usage:
  neactor dev      start dev server
  neactor build    production build
  neactor preview  preview production build
  `);
}
