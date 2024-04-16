import path from "path";
import axios, { AxiosInstance } from "axios";
import curlirize from "axios-to-curl";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";

const envPath = path.resolve(__dirname, "./../../../../../.env");
require("dotenv").config({
	path: envPath,
});

export type ScrapperSettings = {
	cookies?: CookieJar.Serialized["cookies"];
};

class ScrapperController {
	public baseUrl?: string;
	public axios: AxiosInstance;
	public cookies: CookieJar.Serialized["cookies"] = [];
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

	constructor(settings?: ScrapperSettings) {
		if (process.env.DEBUG) {
			this._checkEnvs();
		}

		if (settings?.cookies) {
			this.cookies = settings.cookies;
		}

		if (!this.baseUrl) {
			this.baseUrl = this._getBaseUrl();
		}

		// @ts-expect-error
		if (typeof this.axios === "undefined") {
			this.axios = this._getAxiosInstance();
		}
	}

	private _getBaseUrl = (): string => {
		try {
			if (!process.env.SCRAPPER_BASE_URL) {
				throw "Missing SCRAPPER_BASE_URL in .env file";
			}

			return process.env.SCRAPPER_BASE_URL as string;
		} catch (reason: any) {
			throw new Error(reason);
		}
	};

	private _getAxiosInstance = (): AxiosInstance => {
		// Create Cookie Jar
		const jar = new CookieJar();

		// Axios Instance
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
			},
		});

		// Handle Cookies
		const clientInstance = wrapper(instance);
		if (process.env.DEBUG) {
			// Print cURL request
			curlirize(clientInstance);
		}

		clientInstance.interceptors.request.use((req) => {
			if (process.env.DEBUG) {
				console.log("\n 🔜 Starting Request", {
					method: req.method,
					url: req.url,
					headers: req.headers,
					data: req.data,
				});
			}

			return req;
		});

		clientInstance.interceptors.response.use((res) => {
			if (process.env.DEBUG) {
				const title = this.getPageTitle(res.data);

				console.log("\n 🔚 Response:", {
					status: res.status,
					statusText: res.statusText,
					headers: res.headers,
					data: res.data?.slice(0, 100),
					title,
				});
			}

			const cookies = res.config.jar?.toJSON();
			if (process.env.DEBUG) {
				console.log("🍪 Response Cookies");
				console.log(cookies);
			}
			this.cookies = cookies ? cookies.cookies : [];

			// Return the response
			return res;
		});

		return clientInstance;
	};

	private _checkEnvs() {
		console.log("\n🔍 Check if env variables are set");
		const vars = ["SCRAPPER_BASE_URL", "SCRAPPER_AUTH_USERNAME", "SCRAPPER_AUTH_MD5_PASSWORD", "SCRAPPER_MZSPORT", "SCRAPPER_MZLANG", "DEBUG"];
		vars.forEach((envVar) => {
			console.log(`${envVar}=${process.env[envVar]}`);
		});
		console.log("🔚 Done\n");
	}

	public getCookies(selectedCookies: string[] = this.cookies.map((cookie) => cookie.key)) {
		const filtered = this.cookies.filter((cookie) => selectedCookies.includes(cookie.key));
		const cookies = filtered.map((cookie) => {
			return `${cookie.key}=${cookie.value};`;
			// return `${cookie.key}=${cookie.value}; expires=${cookie.expires}; path=${cookie.path}; domain=*;`;
		});

		return cookies.join(" ");
	}

	public getPageTitle(body: string): string {
		const regex = /<title>(.*?)<\/title>/;
		const pageTitle = body.match(regex);
		const title = pageTitle && pageTitle.length >= 2 ? pageTitle[1] : "";

		return title;
	}
}

export default ScrapperController;
