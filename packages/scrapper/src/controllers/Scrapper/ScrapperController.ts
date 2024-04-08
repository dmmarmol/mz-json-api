import path from "path";
import axios, { AxiosInstance } from "axios";
import cheerio from "cheerio";

require("dotenv").config({
	path: path.resolve(__dirname, "./../../../../../.env"),
});

class ScrapperController {
	public baseUrl: string;
	public axios: AxiosInstance;

	private availablePaths = {
		players: "players",
		transfer: "transfer",
	};
	private availableSub = {
		bids: "your-bids",
		players: "yourplayers",
	};
	public availableRoutes = {
		clubPlayers: `p=${this.availablePaths.players}`,
		followingTransfers: `p=${this.availablePaths.transfer}&sub=${this.availableSub.bids}`,
	};

	constructor() {
		this.checkEnvs();

		if (!process.env.SCRAPPER_BASE_URL) {
			throw new Error("Missing SCRAPPER_BASE_URL in .env file");
		} else {
			this.baseUrl = process.env.SCRAPPER_BASE_URL as string;
		}

		const instance = axios.create({
			baseURL: this.baseUrl,
			timeout: 1000 * 10,
			// withCredentials: true,
			headers: {
				// "Content-Type": "application/x-www-form-urlencoded",
				// "User-Agent": "PostmanRuntime/7.36.0",
				Accept: "*/*",
				"Cache-Control": "no-cache",
				// "Postman-Token": "1bb7df70-0d3d-4c52-96ee-c8e83871bd01",
				// Host: "www.managerzone.com",
				// "Accept-Encoding": "gzip, deflate, br",
				// Connection: "keep-alive",
				// "Content-Length": "114",

				// Accept: "*/*",
				// "Accept-Encoding": "gzip, deflate, br",

				// Host: "www.managerzone.com",
				// Connection: "keep-alive",
				// "Cache-Control": "no-cache",
				// "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
				// 'X-Custom-Header': 'foobar'
				// Cookie: "sessionid=abcdef123456",
			},
		});

		instance.interceptors.request.use((req) => {
			// const { data, ...request } = req;
			console.log("Starting Request", req);
			// console.log("Starting Request", {
			// 	method: request.method,
			// 	url: request.url,
			// 	headers: request.headers,
			// 	data,
			// });
			console.log("\n");

			return req;
		});

		instance.interceptors.response.use((res) => {
			console.log("Response:", {
				status: res.status,
				statusText: res.statusText,
				headers: res.headers,
				data: res.data,
			});
			console.log("\n");

			return res;
		});

		this.axios = instance;
	}

	private checkEnvs() {
		console.log("🔍 Check if env variables are set");
		const vars = ["SCRAPPER_BASE_URL", "SCRAPPER_AUTH_USERNAME", "SCRAPPER_AUTH_MD5_PASSWORD", "SCRAPPER_MZSPORT", "SCRAPPER_MZLANG"];
		vars.forEach((envVar) => {
			console.log(`${envVar}=${process.env[envVar]}`);
		});
		console.log("🔚 Done\n");
	}
}

export default ScrapperController;
