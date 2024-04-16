import cheerio from "cheerio";
import qs from "qs";
import ScrapperController, { ScrapperSettings } from "../Scrapper/ScrapperController";
import { AxiosInstance, AxiosResponse } from "axios";
import { StatusCodes } from "http-status-codes";
import { Cookie } from "tough-cookie";

type AuthCredentials = { username: string; password: string };
// JSON
type JSONPrimitiveValues = string | boolean | number | Cookie.Serialized;
type JSONValues = JSONPrimitiveValues | Array<JSONPrimitiveValues>;
type JSONResponse = JSONValues | Record<string, JSONValues | Record<string, JSONValues>>;

class AuthController extends ScrapperController {
	private RETRY_TIME = 5000;

	constructor() {
		super();

		// console.log("this._isAuthenticated()", this._isAuthenticated());
		// this._authenticate({
		// 	username: process.env.SCRAPPER_AUTH_USERNAME as string,
		// 	password: process.env.SCRAPPER_AUTH_MD5_PASSWORD as string,
		// });
	}

	private _addCookieInterceptor() {
		this.axios.interceptors.request.use((req) => {
			if (this._isAuthenticated()) {
				const cookie = this.getCookies(["PHPSESSID", "MZLANG", "MZSPORT", "MZLOGIN"]);
				req.headers.cookie = cookie;
			}

			return req;
		});
	}

	private _isAuthenticated() {
		return this.cookies.some((cookie) => cookie.startsWith("PHPSESSID"));
	}

	public async authenticate({ username, password }: AuthCredentials): Promise<AxiosResponse<JSONResponse>> {
		if (!username) {
			throw new Error("Missing username. Cannot authenticate");
		}
		if (!password) {
			throw new Error("Missing password. Cannot authenticate");
		}

		// Construct the data payload
		const logindata = {
			md5: password,
			username,
			sport: process.env.SCRAPPER_MZSPORT,
			// markasdefault: ""
			// remember_me: `a:2:{s:8:"username";s:10:"${username}";s:8:"password";s:32:"${password}";}`
		};

		const formData = qs.stringify({ logindata }, { encode: false });

		try {
			if (process.env.DEBUG) {
				console.log("⏳ Ready to login");
			}
			const url = `${this.axios.defaults.baseURL}?p=login`;
			const response = await this.axios.post<string>(url, formData, {
				headers: {
					"Content-type": "application/x-www-form-urlencoded",
				},
				transformRequest: (data) => {
					return formData;
				},
			});

			if (response.status !== 200) {
				throw response;
			}

			const pageTitle = this.getPageTitle(response.data);

			if (pageTitle?.includes("Logout")) {
				throw {
					...response,
					status: StatusCodes.UNAUTHORIZED,
					statusText: "There was an error while loging in",
					data: "Logged out of Managerzone.",
				};
			}

			const json = this.parseAuthenticateResponse(response);

			return {
				...response,
				data: json,
			};
		} catch (response: any) {
			const res: AxiosResponse<string> = response;

			console.error(res.statusText);
			throw res;
		}
	}

	private parseAuthenticateResponse({ data, ...response }: AxiosResponse<string>): JSONValues {
		const cookies = response.config.jar?.toJSON()?.cookies ?? [];

		return cookies;
	}
}

export default AuthController;
