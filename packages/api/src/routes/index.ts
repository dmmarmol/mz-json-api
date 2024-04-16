import { app } from "../app";
import "./AuthRoutes";
import "./ClubRoutes";

app.get("/", (req, res) => {
	res.json({
		message: "API is running!",
	});
});
