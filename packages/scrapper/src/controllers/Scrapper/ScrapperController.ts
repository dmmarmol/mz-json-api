import path from "path";
import axios, { AxiosInstance, HttpStatusCode } from "axios";
import curlirize from "axios-to-curl";
import { wrapper } from "axios-cookiejar-support";
import { Cookie, CookieJar } from "tough-cookie";

const envPath = path.resolve(__dirname, "./../../../../../.env");
require("dotenv").config({
	path: envPath,
});

export type ScrapperSettings = {
	cookies?: Cookie.Serialized[] | Record<string, string>;
};

type availablePaths = "team" | "clubhouse";
type availableSub = "awards";

class ScrapperController {
	public baseURL?: string;
	public axios: AxiosInstance;
	public cookies: Cookie.Serialized[] = [];

	constructor(settings?: ScrapperSettings) {
		if (process.env.DEBUG) {
			this._checkEnvs();
		}

		if (settings?.cookies) {
			if (Array.isArray(settings.cookies)) {
				this.cookies = settings.cookies;
			} else {
				// Convert the object into an array of Cookie.Serialized
				const serializedCookies: Cookie.Serialized[] = Object.entries(settings.cookies).map(([key, value]) => {
					return { key, value };
				});
				console.log({ serializedCookies });
				this.cookies = serializedCookies;
			}
		}

		if (!this.baseURL) {
			this.baseURL = this._getBaseUrl();
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
			baseURL: this.baseURL,
			timeout: 1000 * 10,
			withCredentials: false,
			maxRedirects: 5, // Set the maximum number of redirects to follow
			validateStatus: (status) => (status >= 200 && status < 300) || status === 302, // Allow axios to follow redirects
			headers: {
				Accept: "application/json, text/javascript, */*; q=0.01",
				"X-Requested-With": "XMLHttpRequest",
				"Content-Type": "text/html;charset=utf-8",
			},
		});

		// Handle Cookies
		const clientInstance = wrapper(instance);
		if (process.env.DEBUG) {
			// Print cURL request
			curlirize(clientInstance, () => {
				console.log("\n");
			});
		}

		clientInstance.interceptors.request.use((req) => {
			if (process.env.DEBUG) {
				console.log("\n 🔜 Starting Request", {
					method: req.method,
					url: req.url,
					headers: req.headers,
					data: JSON.stringify(req.data, null, 2),
				});
			}

			return req;
		});

		clientInstance.interceptors.response.use((res) => {
			if (process.env.DEBUG) {
				const title = this.getPageTitle(res?.data);
				console.log("\n 🔚 Response:", {
					url: res.config.url,
					status: res.status,
					statusText: res.statusText,
					headers: res.headers,
					data: JSON.stringify(res.data, null, 2).slice(0, 100),
					title,
				});
			}

			if (res.status === HttpStatusCode.Unauthorized) {
				res.statusText = "Logout";
				res.status = HttpStatusCode.Unauthorized;
				throw res;
			}

			const cookies = res.config.jar?.toJSON();
			if (process.env.DEBUG && cookies?.cookies.length) {
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
		const vars = [
			"SCRAPPER_BASE_URL",
			"SCRAPPER_AUTH_USERNAME",
			"SCRAPPER_AUTH_MD5_PASSWORD",
			"SCRAPPER_MZSPORT",
			"SCRAPPER_MZLANG",
			"DEBUG",
		];
		vars.forEach((envVar) => {
			console.log(`${envVar}=${process.env[envVar]}`);
		});
		console.log("🔚 Done\n");
	}

	public getCookies(selectedCookies: string[] = []) {
		const defaultCookies = this.cookies.map((cookie) => cookie.key);
		const cookiesToUse = selectedCookies.length ? selectedCookies : defaultCookies;

		const filtered = this.cookies.filter((cookie) => cookiesToUse.includes(cookie.key));
		const cookies = filtered.map((cookie) => {
			return `${cookie.key}=${cookie.value};`;
			// return `${cookie.key}=${cookie.value}; expires=${cookie.expires}; path=${cookie.path}; domain=*;`;
		});

		return cookies.join(" ");
	}

	public getResourceUrl(path: string) {
		return `${this.baseURL}${path}`;
	}

	/**
	 * Returns a full MZ Route URL
	 */
	public getFullUrl({ path, sub }: { path: availablePaths; sub?: availableSub }): string {
		const url = [this.baseURL, path ? `?p=${path}` : undefined, sub ? `&sub=${sub}` : undefined];

		return url.filter(Boolean).join("");
	}

	public getPageTitle(body?: any): string {
		const defaultValue: string = "No Title";
		const defaultTitle: string = `<title>${defaultValue}</title>`;
		const regex = /<title>(.*?)<\/title>/;

		const target = body ? body : defaultTitle;
		if (typeof target !== "string") {
			return defaultValue;
		}

		const pageTitle = target.match(regex);
		const title = pageTitle && pageTitle.length >= 2 ? pageTitle[1] : defaultValue;

		return title;
	}
}

export default ScrapperController;
