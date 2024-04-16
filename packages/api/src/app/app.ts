import path from "path";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const envPath = path.resolve(__dirname, "./../../../../.env");
require("dotenv").config({
	path: envPath,
});

if (!process.env.API_PORT) {
	throw new Error("Missing API_PORT .env variable");
}

export const app = express();
export const PORT = process.env.API_PORT;

app.use(express.json());

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to manage sessions
app.use(
	session({
		secret: "your-secret-key",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false }, // Adjust this configuration based on your deployment environment
	})
);
