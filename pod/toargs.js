
export function config2args(id, profile, port, { cookies, proxy, screen, resolution, browserBrand, colorScheme, injectRandomHistory, disableDebugger }) {
	const args = [
	    `--bot-profile=/home/pptruser/profiles/${profile}.enc`,
	    `--remote-debugging-port=${port}`,
	    "--remote-debugging-address=0.0.0.0",
	    "--disable-dev-shm-usage",
	    "--disable-default-apps",
	    "--disable-blink-features=AutomationControlled",
	    "--disable-audio-output",
	    "--disable-setuid-sandbox",
		"--disable-web-security",
		"--disable-features=IsolateOrigins,site-per-process",
	    `--user-data-dir=/tmp/${id}`,
		"--no-sandbox",
	    "--no-first-run"
	];

	if (browserBrand) args.push (`--bot-config-browser-brand="${browserBrand}"`)
	if (colorScheme) args.push (`--bot-config-color-scheme=${colorScheme}`)
	if (screen) args.push (`--bot-config-screen='${JSON.stringify(screen)}'`)
	if (resolution) args.push (`--bot-config-window='${JSON.stringify(resolution)}'`)
	if (injectRandomHistory) args.push ("--bot-config-inject-random-history=true")
	if (disableDebugger) args.push ("--bot-config-disable-debugger=true")

	if (cookies) args.push(`--bot-cookies='${JSON.stringify(cookies)}'`)
	if (proxy) args.push(`--proxy-server="${proxy}"`)

	return args;
}