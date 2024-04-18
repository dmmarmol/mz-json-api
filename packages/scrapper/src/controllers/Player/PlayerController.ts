import cheerio from "cheerio";
import ClubController from "../Club/ClubController";
import { ScrapperSettings } from "../Scrapper/ScrapperController";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";

type PlayersResponse = {
	players: any[];
};
type PlayerControllerMainResponse = PlayersResponse;

class PlayerController extends ClubController {
	constructor(settings?: ScrapperSettings) {
		super(settings);
	}

	public async getPlayers(): AxiosPromise<PlayerControllerMainResponse> {
		try {
			const promises = [
				this.getRequest<PlayersResponse>({
					path: "players",
					parser: this._parseClubPlayersBody,
				}),
				// this.getRequest<ClubAwardsResponse>({
				// 	path: "team",
				// 	sub: "awards",
				// 	parser: this._parseClubAwardsBody,
				// }),
			];
			const [players] = await Promise.all(promises);
			const responseData: PlayerControllerMainResponse = {
				...(players.data as PlayersResponse),
			};

			return {
				...players,
				data: responseData,
			};
		} catch (response: any) {
			const res: AxiosResponse<string> = response;
			throw new AxiosError(res.statusText, undefined, res.config, undefined, res);
		}
	}

	/**
	 * @see https://www.managerzone.com/?p=team
	 */
	private _parseClubPlayersBody = (body: string): PlayersResponse => {
		const $ = cheerio.load(body);
		// const clubName = $("#infoAboutTeam > dd:nth-child(1) > span.teamDataText.clippable").text();
		// const clubId = $("#infoAboutTeam > dd:nth-child(1) > span:nth-child(3)").text().replace(/[()]/g, "");
		// const userName = $("#infoAboutTeam > dd:nth-child(2) > span.teamDataText.clippable").text();
		// const userId = $("#infoAboutTeam > dd:nth-child(2) > span:nth-child(3)").text().replace(/[()]/g, "");
		// const teamRanking = $("#infoAboutTeam > dd:nth-child(3) > span:nth-child(2)").text().replace(/[()]/g, "");
		// const teamEconomyHealth = $(
		// 	"#infoAboutTeam > dd:nth-child(5) > span.financialWealthContainer.financeGradingB"
		// ).text();
		// const teamShapeSrc = $("#infoAboutTeam > dd:nth-child(4) > img").attr("src");
		// const teamLogoSrc = $("#team-shirt-wrapper > img").attr("src");

		// const teamLogoUrl = this.getResourceUrl(teamLogoSrc as string);
		// const teamShapeUrl = this.getResourceUrl(teamShapeSrc as string);

		const result: PlayersResponse = {
			players: [],
		};

		return result;
	};
}

export default PlayerController;
