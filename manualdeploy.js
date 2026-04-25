
import { nodepackagemgmt } from 'right-tool'
import { spawnSync } from "node:child_process";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const tool = nodepackagemgmt();
const result = spawnSync(tool, ["run","deploy"], { cwd: dirname(fileURLToPath(import.meta.url)) //stdio: "inherit" });
});

process.exit(result.status ?? 1);
