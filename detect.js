
import { spawnSync } from "node:child_process";

function has(cmd) {
  const probe = process.platform === "win32" ? "where" : "command";
  const args = process.platform === "win32" ? [cmd] : ["-v", cmd];
  const result = spawnSync(probe, args, { stdio: "ignore", shell: process.platform !== "win32" });
  return result.status === 0;
}

let tools = ["podman","docker"]
let tool;

for (let thistool of tools) {
  let z = has(thistool);
  console.log (thistool, z);
  if (z) {
    tool = thistool;
    break;
  } 
}
if (!tool) {
  console.error("Error: none of the required tools [" + toolstr + "] is installed or in PATH.");
  process.exit(1);
}

const result = spawnSync(tool, process.argv.slice(2), { stdio: "inherit" });
process.exit(result.status ?? 1);