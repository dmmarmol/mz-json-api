import ScrapperController, { ScrapperSettings } from "../Scrapper/ScrapperController";

class PlayerController extends ScrapperController {
	constructor(settings: ScrapperSettings) {
		super(settings);
	}

	public async getPlayers() {
		try {
			const url = `${this.axios.defaults.baseURL}?p=players`;
			const cookies = this.getCookies();
			console.log({ cookies });
			const response = await this.axios.get(url, {
				headers: {
					Cookie: cookies,
				},
			});
		} catch (reason: any) {
			throw new Error(reason);
		}
	}

	// private parseBody(body: string): Record<string, any> {
	// 	const menuIds = ["top_item_club_sub", "top_item_matches", "top_item_federations", "top_item_community", "top_item_store", "top_item_help"];

	// 	const $ = cheerio.load(body);
	// 	const title = $("html head title").html();
	// 	console.log($("#hub-intro > div:nth-child(1) > div > h1").html());

	// 	return {
	// 		title,
	// 	};
	// }
}

export default PlayerController;
