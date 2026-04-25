import { isPackageManager, isNpm, isYarn, isPnpm, isBun } from 'is-npm';
import { spawnSync } from "node:child_process";

const tool = (()=>{
	if (isBun) {
		return "bun"
	} else if (isYarn) {
		return "yarn"
	} else {
		return "npm"
	}
})()

const argsz = process.argv.slice(2);
console.log ("pm.js:", tool, argsz);
const result = spawnSync(tool, argsz, { stdio: "inherit" });
process.exit(result.status ?? 1);