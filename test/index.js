
import { hybrid, Fingerprint } from '../hybrid.js'

import assert from "assert"

(async function test() {
	const fingerprint = new Fingerprint();
	fingerprint.blockWebRTC();
	const client = await hybrid({ fingerprint });
	const response = await client.load("https://www.example.com/");
	const $ = await response.dom();
	client.close();
	let text = $("body > div:nth-child(1) > h1").text();

	assert (text === "Example Domain", `Nope: ${text}`);
	console.log("Passed")
})()
