
import { v4 } from 'uuid'
import { rmSync, existsSync } from 'fs'
import { WebSocket, WebSocketServer } from 'ws'

import { Xvfb } from 'xvfb-ts'
import { spawn } from 'node:child_process'

import { config2args } from './toargs.js'

const PORTS = 42200;

const poolsize = process.env.POOLSIZE || 20;

const MAX_IDLE = 3 * 60 * 1000; // 3 Minutes

const STATUS = {
	IDLE: 0,
	INUSE: 1
}

const { pool, xvfb } = await (function init() {
	return new Promise(async resolve=>{

		let makepool = [];
		const xvfb = new Xvfb();
		const xopts = { displayNum: 99, reuse: true, xvfb_args: ['-screen', 0, '1920x1080x24', '-ac', '+extension', 'GLX', '+render', '-noreset'] };
		await xvfb.start(xopts);
		console.log("Started [Xvfb :"+xopts.displayNum, xopts.xvfb_args.join(), "]");
		const wss = new WebSocketServer({ port: PORTS });
		console.log("[Sleepwalkers] browser launcher / socket server, listening on port:", PORTS)
		
		wss.on('connection', function connection(ws) {
		  ws.on('message', function message(data) {
		    handleRequest(message=>ws.send(JSON.stringify(message)), JSON.parse(data));
		  });
		});

		for (let i = 1; i <= poolsize; i++) {
			makepool[i] = { status: STATUS.IDLE }
		}

		resolve ({ pool: makepool, xvfb });
	})
})();


function openport() {
	for (let i = 1; i <= poolsize; i++) {
		if (pool[i].status === STATUS.IDLE) return i;
	}
}

function handleRequest(respond, { action, profile, config, port, method }) {
	function launcher(portnum) {
		const exe = process.env.BROWSER_BOT;
		const version = process.env.VERSION_BOT;

		const id = v4();

		const controller = new AbortController();
		const { signal } = controller;
		const args = config2args(id, profile, PORTS+portnum, config)
		
		const browser = spawn(exe, args, { signal });
		console.log(exe, args);
		let idlecheck;

		async function quitter() {
			if (pool[portnum].status === STATUS.INUSE) {
				clearInterval(idlecheck);
				pool[portnum] = { status: STATUS.IDLE };
				console.log(" >> closing, port:", PORTS+portnum);

				setTimeout(function(){
					if (existsSync("/tmp/" + id)) rmSync("/tmp/" + id, { recursive: true });
				},200);
			}
		}
		browser.stdout.on("data", data=>{
			console.log("[browser-"+portnum+"][INFO]", data.toString());
		})
		browser.stderr.on("data", data=>{
			console.log("[browser-"+portnum+"][ERROR]", data.toString());
		})

		browser.on('close', quitter);
		browser.on('error', error=>{
			if (!error.message.includes("operation was aborted")) {
				console.log("[error] port:", PORTS+portnum, error.message);
				quitter();
			}
		});

		idlecheck = setInterval(function(){
			let elapsed = new Date().getTime() - pool[portnum].since;
			if (elapsed > MAX_IDLE) {
				controller.abort();
			}
		})

		let portstatus = pool[portnum] = { status: STATUS.INUSE, since: new Date().getTime(), controller, idlecheck };

		let start = new Date().getTime();
		(function verifyCDP() {
			setTimeout(function() {
				fetch("http://localhost:"+(PORTS + portnum)).then(response=>{
					if (response.ok) {
						console.log("["+action, "port:", (PORTS + portnum), " -- elapsed:", (new Date().getTime() - start), "ms]");
						respond({ action: "launch", success: true, version, port: (PORTS+portnum) });
					} else {
						verifyCDP();
					}
				}).catch(err=>{
					verifyCDP();
				})
			},5000)
		})();
	}
	
	switch (action) {
	case "launch":
		let portnum = openport();
		if (!portnum) {
			respond({ action: "launch", success: false, error: new Error("maximum instances (" + poolsize + ") already in use.") });
		} else {
			launcher(portnum)
		}
		break;

	case "wait":
		let intv = setInterval(function() {
			let portnum = openport();
			if (portnum) {
				clearInterval(intv);

				launcher(portnum);
			}
		}, 5000);
		break;

	case "activity":
		console.log("[activity] port:", port, " -- method:", method);
		pool[port-PORTS].since = new Date().getTime();
		break;

	case "close":
		console.log("[close] port:", port);
		pool[port-PORTS].controller.abort();
		break;

	case "destroy":
		xvfb.stop();
		process.exit(0)
	}
}
