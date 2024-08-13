import { HttpStatusCode } from "axios";
import { app } from "../../app";
import { ClubController } from "scrapper";

app.get("/club/info", async (req, res) => {
	try {
		const cookies: Record<string, string> = req.cookies;
		const club = new ClubController({ cookies });

		const response = await club.getClubInfo();

		if (response.status !== HttpStatusCode.Ok) {
			throw response;
		}

		res.status(response.status).json(response.data);
	} catch (response: any) {
		res.status(response.status).json(response.data);
	}
});
