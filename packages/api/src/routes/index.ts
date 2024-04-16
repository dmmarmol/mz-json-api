import { app } from "../app";
import "./AuthRoutes";

app.get("/", (req, res) => {
	res.json({
		message: "API is running!",
	});
});
