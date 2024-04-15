import path from "path";
import express from "express";

const envPath = path.resolve(__dirname, "./../../../.env");
require("dotenv").config({
	path: envPath,
});

console.log(envPath);

if (!process.env.API_PORT) {
	throw new Error("Missing API_PORT .env variable");
}

const app = express();
const PORT = process.env.API_PORT;

app.get("/", (req, res) => {
	res.send("API is running!");
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
