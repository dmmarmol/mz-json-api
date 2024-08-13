import { HttpStatusCode } from "axios";
import { app } from "../../app";

app.get("/layout/navigation", async (req, res) => {
	try {
		const navigation = {
			club: {
				items: [
					{ id: "#top_item_fa-home", title: "Club", link: "club", mzLink: "?p=clubhouse" },
					{ id: "#sub_page_nav_club_home", title: "Equipo", link: "team", mzLink: "?p=team" },
					{ id: "#sub_page_nav_economy", title: "Finanzas", link: "economy", mzLink: "?p=economy" },
				],
			},
			players: {
				items: [
					{ id: "#sub_page_nav_player_profiles", title: "Jugadores", link: "players", mzLink: "?p=players" },
				],
			},
			matches: {
				items: [
					{
						id: "#sub_page_nav_fixtures",
						title: "Partidos",
						link: "matches",
						mzLink: "?p=match&sub=scheduled",
					},
				],
			},
		};

		res.status(HttpStatusCode.Ok).json(navigation);
	} catch (response: any) {
		console.log(response);
		res.status(response.status).json(response.data);
	}
});
