import { app } from "../app";
import { AuthController } from "scrapper";

app.get("/", (req, res) => {
	res.json({
		message: "API is running!",
	});
});

app.post("/login", async (req, res) => {
	// res.json({
	// 	message: "Login request",
	// 	body: req.body,
	// });

	try {
		const authController = new AuthController({
			username: req.body["username"],
			password: req.body["password"],
		});
		const response = await authController.authenticate();
		res.json(JSON.stringify(response, null, 2));
	} catch (reason: any) {
		res.status(500).send({
			message: "There was an error",
			error: JSON.stringify(reason),
		});
	}
});
