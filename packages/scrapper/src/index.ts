import { AuthController, PlayerController } from "./controllers";

export * from "./controllers";

async function init() {
	const auth = new AuthController();
	await auth.authenticate({ username: process.env.SCRAPPER_AUTH_USERNAME as string, password: process.env.SCRAPPER_AUTH_MD5_PASSWORD as string });
	// console.log(auth.cookies, auth.getCookies());

	const player = new PlayerController({ cookies: auth.cookies });
	await player.getPlayers();
}

if (process.env.DEBUG) {
	// init();
}
