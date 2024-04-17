import { AuthController, ClubController, NavigationController, PlayerController } from "./controllers";

export * from "./controllers";

async function init() {
	const auth = new AuthController();
	await auth.authenticate({
		username: process.env.SCRAPPER_AUTH_USERNAME as string,
		password: process.env.SCRAPPER_AUTH_MD5_PASSWORD as string,
	});
	// console.log(auth.cookies, auth.getCookies());

	// const player = new PlayerController({ cookies: auth.cookies });
	// await player.getPlayers();
	const club = new ClubController({ cookies: auth.cookies });
	await club.getClubInfo();
	// const navigation = new NavigationController({ cookies: auth.cookies });
	// await navigation.getNavigation();
}

if (process.env.DEBUG) {
	// init();
}
