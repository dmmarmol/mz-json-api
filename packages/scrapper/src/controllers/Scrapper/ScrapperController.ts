import path from "path";
import axios, { AxiosInstance, HttpStatusCode } from "axios";
import curlirize from "axios-to-curl";
import { wrapper } from "axios-cookiejar-support";
import { Cookie, CookieJar } from "tough-cookie";
import { FullUrlCombinations, KEY_MESSAGE, SCRAPPER_HEADERS } from "../types";
import cheerio, { CheerioAPI } from "cheerio";

const envPath = path.resolve(__dirname, "./../../../../../.env");
require("dotenv").config({
	path: envPath,
});

export type ScrapperSettings = {
	cookies?: Cookie.Serialized[] | Record<string, string>;
};

class ScrapperController {
	public baseURL?: string;
	public axios: AxiosInstance;
	public cookies: Cookie.Serialized[] = [];
	public isDebug: boolean = JSON.parse(process.env.DEBUG as string);

	constructor(settings?: ScrapperSettings) {
		this.isDebug = JSON.parse(process.env.DEBUG as string);
		if (JSON.parse(process.env.DEBUG as string)) {
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
			transformResponse: (data, headers) => {
				headers.originalData = data;
				// headers.originalHeaders = headers;
				return data;
			},
			// beforeRedirect(options, responseDetails) {
			// 	// const path = options.search;
			// 	const path = responseDetails.headers.location;

			// 	if (responseDetails.statusCode === HttpStatusCode.Found) {
			// 		responseDetails.statusCode = HttpStatusCode.Unauthorized;
			// 		console.debug("🔒 Unauthorized", `Path: ${path} | Status: ${responseDetails.statusCode}`);
			// 		return;
			// 	}

			// 	if (path.includes("/?p=logout")) {
			// 		responseDetails.statusCode = HttpStatusCode.Unauthorized;
			// 		console.debug("❌ Logout", `Path: ${path} | Status: ${responseDetails.statusCode}`);
			// 		return;
			// 	}

			// 	if (path.includes("/?p=start&msg=wrong_username_or_password")) {
			// 		responseDetails.statusCode = HttpStatusCode.Unauthorized;
			// 		console.debug("❌ Wrong Credentials", `Path: ${path} | Status: ${responseDetails.statusCode}`);
			// 		return;
			// 	}

			// 	return;
			// },
			maxRedirects: 5, // Set the maximum number of redirects to follow
			validateStatus: (status) => {
				// Allow axios to follow redirects
				return (
					(status >= HttpStatusCode.Ok && status < HttpStatusCode.MultipleChoices) ||
					status === HttpStatusCode.Found
				);
			},
			headers: {
				// [SCRAPPER_HEADERS.ACCEPT]: "application/json, text/javascript, */*; q=0.01",
				[SCRAPPER_HEADERS.ACCEPT]: "*/*",
				[SCRAPPER_HEADERS.X_REQUESTED_WITH]: "XMLHttpRequest",
				[SCRAPPER_HEADERS.CONTENT_TYPE]: "text/html;charset=utf-8",
				// [SCRAPPER_HEADERS.ACCESS_CONTROL_HEADERS]: "*",
			},
		});

		const clientInstance = wrapper(instance);
		if (this.isDebug) {
			// Print cURL request
			curlirize(clientInstance);
		}

		clientInstance.interceptors.request.use((req) => {
			if (this.isDebug) {
				console.debug(" 🔜 Starting Request", {
					method: req.method,
					url: req.url,
					headers: req.headers,
					data: JSON.stringify(req.data, null, 2),
				});
			}

			return req;
		});

		clientInstance.interceptors.response.use((res) => {
			const messages = this.getPageMessages(res?.headers.originalData);

			if (this.isDebug) {
				console.debug(" 🔚 Response:", {
					url: res.config.url,
					status: res.status,
					statusText: res.statusText,
					headers: Object.keys(res.headers).reduce((acc, key) => {
						const header = res.headers[key];
						return { ...acc, [key]: `${header}`.length > 75 ? `${header.slice(0, 75)}...` : header };
					}, {}),
					data: typeof res.data === "string" ? JSON.stringify(res.data, null, 2).slice(0, 100) : res.data,
					title: messages,
				});
			}

			try {
				// Wrong Credentials
				if (messages.invalidCredentials.includes(KEY_MESSAGE.INVALID_CREDENTIALS)) {
					res.statusText = messages.invalidCredentials;
					res.status = HttpStatusCode.Unauthorized;
					console.debug(messages.invalidCredentials, "About to throw an unauthorized response ->");
					throw res;
				}

				// Logged Out
				if (messages.pageTitle.includes(KEY_MESSAGE.LOGOUT)) {
					res.statusText = messages.pageTitle;
					res.status = HttpStatusCode.Unauthorized;
					console.debug(messages.pageTitle, "About to throw an unauthorized response ->");
					throw res;
				}
			} catch (error: any) {
				return error;
			}

			const cookies = res.config.jar?.toJSON();
			this.cookies = cookies ? cookies.cookies : [];
			if (this.isDebug && cookies?.cookies.length) {
				console.debug("🍪 Response Cookies", this.getCookies());
			}

			// Return the response
			return res;
		});

		return clientInstance;
	};

	private _checkEnvs() {
		console.debug("🔍 Check if env variables are set");
		const vars = [
			"NODE_ENV",
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
	}

	/**
	 * Returns a string containing the existing cookies
	 */
	public getCookies(selectedCookies: string[] = []): string {
		const defaultCookies = this.cookies.map((cookie) => cookie.key);
		const cookiesToUse = selectedCookies.length ? selectedCookies : defaultCookies;

		const filtered = this.cookies.filter((cookie) => cookiesToUse.includes(cookie.key));
		const cookies = filtered.map((cookie) => {
			return `${cookie.key}=${cookie.value};`;
			// return `${cookie.key}=${cookie.value}; expires=${cookie.expires}; path=${cookie.path}; domain=*;`;
		});

		return cookies.join(" ");
	}

	/**
	 * Returns an absolute MZ resource URL
	 */
	public getResourceUrl(path: string) {
		return `${this.baseURL}${path}`;
	}

	/**
	 * Returns a full MZ Route URL
	 */
	public getFullUrl({ path, sub }: FullUrlCombinations): string {
		const url = [this.baseURL, path ? `?p=${path}` : undefined, sub ? `&sub=${sub}` : undefined];

		return url.filter(Boolean).join("");
	}

	private messagesSelector = {
		invalidCredentials: ($: CheerioAPI): string => {
			const htmlRegex = /(?<=<[^>]>)([^<]+)(?=<\/[^>]+>)/;
			const value = $("#login_form_content > div.form_error_content.wrong_username_or_password").html() as string;
			const matched = `${value}`.match(htmlRegex);

			return matched?.length ? matched[1] : "";
		},
		pageTitle: ($: CheerioAPI): string => {
			const htmlRegex = /(?<=<[^>]>)([^<]+)(?=<\/[^>]+>)/;
			const value = $("head > title").html() as string;
			const matched = `${value}`.match(htmlRegex);

			return matched?.length ? matched[1] : "";
		},
	};

	private getPageMessages(body: string): Record<keyof typeof this.messagesSelector, string> {
		const defaultBody = "<html>Default</html>";
		const $ = cheerio.load(body ? body : defaultBody);

		const messages = Object.keys(this.messagesSelector).reduce((acc, key) => {
			const selectorFn = this.messagesSelector[key as keyof typeof this.messagesSelector];
			const content = selectorFn($);

			return { ...acc, [key]: content };
		}, {} as Record<keyof typeof this.messagesSelector, string>);

		return messages;
	}
}

export default ScrapperController;
