import cheerio from "cheerio";
import ScrapperController, { ScrapperSettings } from "../Scrapper/ScrapperController";

export type NavigationItem = {
	id: string;
	title: string;
	link: string;
	mzLink: string;
};
export type NavigationResponse = {
	menu: {
		club: {
			items: NavigationItem[];
		};
		players: {
			items: NavigationItem[];
		};
		matches: {
			items: NavigationItem[];
		};
	};
};

class NavigationController extends ScrapperController {
	constructor(settings: ScrapperSettings) {
		super(settings);
	}

	private parseNavigationBody(body: string): any {
		const $ = cheerio.load(body);
		const menuIds = [
			"top_item_club_sub",
			"top_item_matches",
			"top_item_federations",
			"top_item_community",
			"top_item_store",
			"top_item_help",
		];

		// const menu #top_item_club_sub > li:nth-child(1) > ul
		const menu = {
			club: {
				list: {
					root: "#top_item_club_sub > li:nth-child(1) .subpage_nav",
					items: {
						// root: "#top_item_club_sub > li:nth-child(1)",
						// list: "#top_item_club_sub .subpage_nav",
						root: "#top_item_club_sub > li:nth-child(1) .subpage_nav li",
						values: [
							"#sub_page_nav_club_home",
							"#sub_page_nav_customise_club",
							"#sub_page_nav_economy",
							"#sub_page_nav_stadium",
							"#sub_page_nav_achievements",
							"#sub_page_nav_trophies",
							"#sub_page_nav_statistics",
							"#sub_page_nav_cup_performance",
						],
					},
				},
			},
			matches: {
				list: {
					root: "#top_item_matches_sub > li:nth-child(1) .subpage_nav",
					items: {
						root: "#top_item_matches_sub > li:nth-child(1) .subpage_nav li",
						values: [
							"#sub_page_nav_fixtures",
							"#sub_page_nav_results_visible",
							"#sub_page_nav_match_hidden_result",
							"#sub_page_nav_livescores",
						],
					},
				},
			},
		};

		console.log($(menu.club.list.items.root));
		const menuClubItems = $(menu.club.list.items.root).toArray();
		const menuClubLinks = menuClubItems.map((item) => {
			const anchor = $(item).children("a");
			const link = anchor.attr("href");
			const title = anchor.text();

			return {
				title,
				link,
			};
		});

		console.log(menuClubItems);

		return {
			menu: {
				club: {
					items: menuClubLinks,
				},
			},
		};
	}
}

export default NavigationController;
