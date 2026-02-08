function dimensions (w,h,d=24) {
	return {
		screen: {width: w, height: h, colorDepth: d, pixelDepth: d},
		window: {
			innerWidth: w,
			innerHeight: h,
			outerWidth: w,
			outerHeight: h,
			screenX: 0,
			screenY: 0,
			devicePixelRatio: 1
		}
	}
}

export class BotBrowserConfig {

	constructor() {
		this.profile = {};
		this.filename = "win";
	}

	darkScheme(dark) {
		if (dark) {
			this.profile.colorScheme = "dark";
		} else {
			this.profile.colorScheme = "light";
		}
	}

	brand(name) {
		const VALID = ["chrome", "chromium", "edge", "brave"];
		if (VALID.includes(name)) {
			this.profile.browserBrand = name
		} else {
			console.warn("unknown brand requested:", name, "\nvalid brands are:", VALID);
		}
	}

	platform(name) {
		const VALID = ["win", "mac", "android"];
		if (VALID.includes(name)) {
			this.filename = name;
		} else {
			console.warn("unknown platform requested:", name, "\nvalid platforms are:", VALID, "default will be used:", VALID[0]);
			this.filename = VALID[0];
		}
	}

	injectRandomHistory(enable) {
		if (enable === true) {
			this.profile.injectRandomHistory = true;
		} else {
			this.profile.injectRandomHistory = undefined;
		}
	}

	disableDebugger(disable) {
		if (disable !== false) {
			this.profile.disableDebugger = true;
		} else {
			this.profile.disableDebugger = undefined;
		}
	}

	resolution(w, d) {
		let dims;
		switch (w) {
			case 3840:
				dims = dimensions(3840, 2160, d || 24);break;
			case 1920:
				dims = dimensions(1920, 1080, d || 24);break;
			case 1680:
				dims = dimensions(1680, 1050, d || 24);break;
			case 1600:
				dims = dimensions(1600, 1200, d || 24);break;
			case 1440:
				dims = dimensions(1440, 900, d || 24);break;
			case 1280:
				dims = dimensions(1280, 1024, d || 16);break;
			case 1024:
				dims = dimensions(1024, 768, d || 16);break;
			case 800:
				dims = dimensions(800, 600, d || 8);break;
			default:
				resolution(1280);
		}
		if (dims) {
			this.profile.screen = dims.screen
			this.profile.resolution = dims.window
		}
	}

	toString(){
		return JSON.stringify({
			action: this.action,
			config: this.profile,
			profile: this.filename 
		})
	}

	static randomize() {
		let c = new BotBrowserConfig();
		let r_plat = Math.random();
		if (r_plat > 0.75) {
			c.platform("mac")

		} else {
			let r_brand = Math.random();

			if (r_brand > 0.5) {
				if (r_brand < 0.9) {
					c.brand("edge")
				} else if (r_brand > 0.975) {
					c.brand("brave")
				} else {
					c.brand("chromium")
				}
			}
		}

		let r_reso = Math.random();
		let r_depth = Math.random();
		let r_cs = Math.random();
		if (r_reso > 0.95) {
			c.resolution(1680)
			if (r_cs > 0.75) c.darkScheme(true); 
		} else if (r_reso > 0.9) {
			c.resolution(1440)
			if (r_cs > 0.65) c.darkScheme(true); 
		} else if (r_reso > 0.875) {
			c.resolution(1600)
			if (r_cs > 0.85) c.darkScheme(true); 
		} else if (r_reso > 0.85) {
			if (r_cs > 0.9) c.darkScheme(true); 
			c.resolution(1280, r_depth > 0.25 ? 24 : 16)
		} else if (r_reso > 0.825) {
			c.resolution(1024, r_depth > 0.65 ? 24 : 16)
		} else if (r_reso > 0.8) {
			c.resolution(800, r_depth > 0.75 ? 16 : 8)
		} else if (r_reso > 0.5) {
			c.resolution(3840)
			if (r_cs > 0.4) c.darkScheme(true); 
		} else if (r_reso > 0.15) {
			c.resolution(1920)
			if (r_cs > 0.5) c.darkScheme(true); 
		} else {
			if (r_cs > 0.65) c.darkScheme(true); 
		}

		let r_rh = Math.random();
		if (r_rh > 0.35) c.injectRandomHistory(true);

		return c;
	}
}