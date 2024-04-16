import { StatusCodes } from "http-status-codes";
import { app } from "../../app";
import { ClubController } from "scrapper";

app.get("/club-house", async (req, res) => {
	try {
		const cookies: Record<string, string> = req.cookies;
		const club = new ClubController({ cookies });

		const response = await club.getClubHouse();

		if (response.status !== StatusCodes.OK) {
			throw response;
		}

		res.status(response.status).json(response.data);
	} catch (response: any) {
		console.log(response);
		res.status(response.status).json(response.data);
	}
});
