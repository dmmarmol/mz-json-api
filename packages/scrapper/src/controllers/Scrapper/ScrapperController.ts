import path from "path";
import axios, { AxiosInstance } from "axios";
import curlirize from "axios-to-curl";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

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
		if (process.env.DEBUG) {
			this._checkEnvs();
		}
		this.baseUrl = this._getBaseUrl();
		this.axios = this._getAxiosInstance();
	}

	_getBaseUrl = (): string => {
		try {
			if (!process.env.SCRAPPER_BASE_URL) {
				throw "Missing SCRAPPER_BASE_URL in .env file";
			}

			return process.env.SCRAPPER_BASE_URL as string;
		} catch (reason: any) {
			throw new Error(reason);
		}
	};

	_getAxiosInstance = (): AxiosInstance => {
		// Create Cookie Jar
		const jar = new CookieJar();

		const instance = axios.create({
			jar,
			baseURL: this.baseUrl,
			timeout: 1000 * 10,
			withCredentials: false,
			maxRedirects: 5, // Set the maximum number of redirects to follow
			validateStatus: (status) => (status >= 200 && status < 300) || status === 302, // Allow axios to follow redirects

			headers: {
				Accept: "application/json, text/javascript, */*; q=0.01",
				"X-Requested-With": "XMLHttpRequest",
				"Access-Control-Allow-Origin": "*",
				// 'Content-Type': 'application/x-www-form-urlencoded',
				// "Content-Type": "application/x-www-form-urlencoded",
				// "User-Agent": "PostmanRuntime/7.36.0",
				// Accept: "*/*",
				// "Cache-Control": "no-cache",
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

		// Handle Cookies
		const clientInstance = wrapper(instance);

		clientInstance.interceptors.request.use((req) => {
			// @ts-ignore
			curlirize(clientInstance);

			// if (typeof req.url === "string") {
			// 	const hasTrailingSlash = req.url[req.url.length - 1] === "/";
			// 	if (!hasTrailingSlash) {
			// 		req.url += "/";
			// 	}
			// }
			// console.log("Starting Request", req);
			if (process.env.DEBUG) {
				console.log("Starting Request", {
					method: req.method,
					url: req.url,
					headers: req.headers,
					data: req.data,
				});
			}
			// console.log(typeof req.data);
			// console.log("\n");

			return req;
		});

		clientInstance.interceptors.response.use((res) => {
			if (process.env.DEBUG) {
				console.log("Response:", {
					status: res.status,
					statusText: res.statusText,
					headers: res.headers,
					data: res.data,
				});
				console.log("\n");
			}

			return res;
		});

		return clientInstance;
	};

	private _checkEnvs() {
		console.log("\n🔍 Check if env variables are set");
		const vars = ["SCRAPPER_BASE_URL", "SCRAPPER_AUTH_USERNAME", "SCRAPPER_AUTH_MD5_PASSWORD", "SCRAPPER_MZSPORT", "SCRAPPER_MZLANG"];
		vars.forEach((envVar) => {
			console.log(`${envVar}=${process.env[envVar]}`);
		});
		console.log("🔚 Done\n");
	}
}

export default ScrapperController;
