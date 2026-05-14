#!/usr/bin/env node

import fs from "fs";
import { cwd } from "node:process";
import { dirname } from "node:path";
import path from "path";

import readline from "readline";
import { execSync } from "child_process";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const projectFolderName = await new Promise((resolve) => {
  rl.question("Project name: ", resolve);
});

rl.close();

console.log(projectFolderName);

const templateDir = path.resolve(import.meta.dirname, "./template");
const targetDir = path.resolve(cwd(), `./${projectFolderName}`);

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}

fs.cpSync(templateDir, targetDir, { recursive: true });

// npm can publish template .gitignore as .npmignore; restore expected file name.
const generatedNpmIgnorePath = path.join(targetDir, ".npmignore");
const generatedGitIgnorePath = path.join(targetDir, ".gitignore");

if (
  fs.existsSync(generatedNpmIgnorePath) &&
  !fs.existsSync(generatedGitIgnorePath)
) {
  fs.renameSync(generatedNpmIgnorePath, generatedGitIgnorePath);
}

execSync("npm install", { cwd: targetDir, stdio: "inherit" });
execSync("npm run dev", { cwd: targetDir, stdio: "inherit" });
