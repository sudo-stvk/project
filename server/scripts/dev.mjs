import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = ["server", "client"].map((dir) =>
  spawn(npm, ["--prefix", dir, "run", "dev"], {
    stdio: "inherit",
    cwd: projectRoot,
    shell: process.platform === "win32",
  }),
);
process.on("SIGINT", () => children.forEach((child) => child.kill()));
