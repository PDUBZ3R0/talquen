
import fontlist from './fonts.js'

function normalize(proxy, fingerprint) {
    let auth = /^((?:https?|socks[45]h?):\/\/)([^:]+):(.+)@([^@]+)$/;
    if (auth.test(proxy)) {
        let parts = proxy.matches(auth);
        fingerprint.proxy_server = `${parts[1]}${parts[4]}`;
        fingerprint.proxy_username = parts[2];
        fingerprint.proxy_password = parts[3];
    } else {
        fingerprint.proxy_server = proxy.indexOf("://") > -1 ? proxy : "http://"+proxy
    }
}

export class Fingerprint {
	constructor() {
		this.fingerprint = {
			"persistent_context": true,
			"humanize": 2.5,
			"fonts": (()=>{
				// Randomly selects a set of 10-25 fonts from fonts.js
				let f = [];
				for (let i = 0; i < Math.round((100/Math.round(Math.random()*6)+4)*Math.random()); i++) {
					let c = fontlist[Math.round(Math.random()*fontlist.length)];
					if (!f.includes(c)) f.push(c);
					else i--;
				}
				return f;
			})()
		}
	}

	set os(value) {
		this.fingerprint.os = value; 
	}

	set locale(value) {
		this.fingerprint.locale = value;
	}

	set humanize(value) {
		this.fingerprint.humanize = value;
	}

	set window(value) {
		if (typeof value === "number") {
			switch (value){
				case 3840:
					this.fingerprint.window = "3840x2160"
					break;
				case 1920:
					this.fingerprint.window = "1920x1808"
					break;
				case 1680:
					this.fingerprint.window = "1968x1050"
					break;
				case 1600:
					this.fingerprint.window = "1600x1200"
					break;
				case 1440:
					this.fingerprint.window = "1440x900"
					break;
				case 1280:
					this.fingerprint.window = "1280x1024"
					break;
				case 1024:
					this.fingerprint.window = "1024x768"
					break;
				case 800:
					this.fingerprint.window = "800x600"
					break;
				default:
					this.fingerprint.window = `${value}x${Math.round(value * 9 / 16)}`
			}
		} else if (/^\d+X\d+$/.test(value)) {
			this.fingerprint.window = value
		}
	}

	set proxy(value) {
    	if (!proxy) return
		normalize(value, this.fingerprint);
	}

	webgl(vendor, renderer) {
		this.fingerprint.webgl_vendor = vendor;
		this.fingerprint.webgl_renderer = renderer;
	}

	enableCache(){
		this.fingerprint.enable_cache = true;
	}

	enableMainWorldEval() {
		this.fingerprint.main_world_eval = true;
	}

	enablePersistentContext() {
		this.fingerprint.persistent_context = true;
	}

	disableCoop() {
		this.fingerprint.disable_coop = true;
	}

	blockImages() {
		this.fingerprint.block_images = true;
	}

	blockWebRTC() {
		this.fingerprint.block_webrtc = true;
	}

	blockWebGL() {
		this.fingerprint.block_webgl = true;
	}
}