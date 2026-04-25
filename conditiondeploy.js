
import { containerengine } from 'right-tool'

const ngn = containerengine();
if (ngn) {
	process.exit(0)
} else {
	console.error("@@@ TALQUEN did not detect an available container engine !!");
	console.info ("  o-- Once you have installed the desired application [ Docker, Podman, Kubernetes ] ");
	console.info ("  --o you can manually trigger the deployment again by calling:\n");
	console.info ("      $ talquen-deploy");
	process.exit(3625);
}