import cheerio from "cheerio";
import { AxiosPromise, AxiosResponse } from "axios";
import ScrapperController, { ScrapperSettings } from "../Scrapper/ScrapperController";
import { JSONResponse } from "controllers/types";

type ClubInfoResponse = {
	club: {
		id: string;
		name: string;
	};
	user: {
		id: string;
		name: string;
	};
	team: {
		ranking: string;
		economyHealth: string;
		logo: string;
		shape: string;
	};
};
type ClubAward = {
	tournamentTitle: string;
	list: {
		src: string;
		title: string;
		season: string;
	}[];
};
type ClubAwardsResponse = { awards: ClubAward[] };
type ClubControllerMainResponse = ClubInfoResponse & ClubAwardsResponse;
type GetRequestParams<R extends JSONResponse> = {
	path: "team" | "clubhouse";
	sub?: "awards";
	parser(body: string): R;
};

class ClubController extends ScrapperController {
	constructor(settings: ScrapperSettings) {
		super(settings);
	}

	public async getClubInfo(): AxiosPromise<ClubControllerMainResponse> {
		try {
			const promises = [
				this._getRequest<ClubInfoResponse>({
					path: "team",
					parser: this._parseClubTeamBody,
				}),
				this._getRequest<ClubAwardsResponse>({
					path: "team",
					sub: "awards",
					parser: this._parseClubAwardsBody,
				}),
			];
			const [info, awards] = await Promise.all(promises);
			// const [info] = await Promise.all(promises);
			const responseData: ClubControllerMainResponse = {
				...(info.data as ClubInfoResponse),
				...(awards.data as ClubAwardsResponse),
			};

			return {
				...awards,
				data: responseData,
			};
		} catch (response: any) {
			throw new Error(response);
		}
	}

	private _getRequest<R>({ path, sub, parser }: GetRequestParams<R>): AxiosPromise<R> {
		try {
			const url = this.getFullUrl({ path, sub });
			const cookies = this.getCookies();
			const request = this.axios.get(url, {
				headers: {
					Cookie: cookies,
				},
				transformResponse: (data) => {
					return parser(data);
				},
			});

			return request;
		} catch (response: any) {
			const res: AxiosResponse<string> = response;
			console.error(res.statusText);
			throw res;
		}
	}

	/**
	 * @see https://www.managerzone.com/?p=team
	 */
	private _parseClubTeamBody = (body: string): ClubInfoResponse => {
		const $ = cheerio.load(body);
		const clubName = $("#infoAboutTeam > dd:nth-child(1) > span.teamDataText.clippable").text();
		const clubId = $("#infoAboutTeam > dd:nth-child(1) > span:nth-child(3)").text().replace(/[()]/g, "");
		const userName = $("#infoAboutTeam > dd:nth-child(2) > span.teamDataText.clippable").text();
		const userId = $("#infoAboutTeam > dd:nth-child(2) > span:nth-child(3)").text().replace(/[()]/g, "");
		const teamRanking = $("#infoAboutTeam > dd:nth-child(3) > span:nth-child(2)").text().replace(/[()]/g, "");
		const teamEconomyHealth = $(
			"#infoAboutTeam > dd:nth-child(5) > span.financialWealthContainer.financeGradingB"
		).text();
		const teamShapeSrc = $("#infoAboutTeam > dd:nth-child(4) > img").attr("src");
		const teamLogoSrc = $("#team-shirt-wrapper > img").attr("src");

		const teamLogoUrl = this.getResourceUrl(teamLogoSrc as string);
		const teamShapeUrl = this.getResourceUrl(teamShapeSrc as string);

		const result: ClubInfoResponse = {
			club: {
				id: clubId,
				name: clubName,
			},
			user: {
				id: userId,
				name: userName,
			},
			team: {
				ranking: teamRanking,
				economyHealth: teamEconomyHealth,
				logo: teamLogoUrl,
				shape: teamShapeUrl,
			},
		};

		return result;
	};

	/**
	 * @see https://www.managerzone.com/?p=team&sub=awards
	 */
	private _parseClubAwardsBody = (body: string): ClubAwardsResponse => {
		const $ = cheerio.load(body);
		const cabinets = $("#cabinet_content .cabinet-wrapper").toArray();
		const trophiesList = cabinets.map((cabinet) => {
			const tournament = $(cabinet).find(".cabinet h2:nth-child(2)").text();
			const trophyList = $(cabinet)
				.find(".trophy-list tbody tr")
				.toArray()
				.filter((row) => {
					const title = $(row).find(":nth-child(odd) > td:nth-child(1) b").text();
					return Boolean(title.length);
				})
				.map((row) => {
					const title = $(row).find(":nth-child(odd) > td:nth-child(1) b").text();
					const src = $(row).find(":nth-child(odd) > td.trophy-container img").attr("src") as string;
					const resourceUrl = this.getResourceUrl(src);
					const season = $(row).find(":nth-child(even) > td").text();

					return {
						title,
						season,
						src: resourceUrl,
					};
				});

			return {
				tournamentTitle: tournament,
				list: trophyList,
			};
		});

		const result: ClubAwardsResponse = {
			awards: trophiesList,
		};

		return result;
	};
}

export default ClubController;
