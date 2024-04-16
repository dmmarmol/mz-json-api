import { app } from "../app";
import { AuthController } from "scrapper";

app.get("/", (req, res) => {
	res.json({
		message: "API is running!",
	});
});

app.post("/login", async (req, res) => {
	try {
		const credentials = {
			username: req.body["username"],
			password: req.body["password"],
		};
		const authController = new AuthController();
		const response = await authController.authenticate(credentials);

		res.status(response.status).json(response.data);
	} catch (reason: any) {
		res.status(500).send({
			message: "There was an error",
			error: JSON.stringify(reason),
		});
	}
});
