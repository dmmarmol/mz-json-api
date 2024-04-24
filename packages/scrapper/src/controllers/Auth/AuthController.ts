import qs from "qs";
import ScrapperController from "../Scrapper/ScrapperController";
import { AxiosError, AxiosPromise, AxiosResponse, HttpStatusCode } from "axios";
import { CookieJar } from "tough-cookie";
import { JSONResponse, SCRAPPER_HEADERS } from "../types";

type AuthCredentials = { username: string; password: string };
// AuthController
type AuthenticateResponse = JSONResponse<CookieJar.Serialized>;

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

	public async authenticate({ username, password }: AuthCredentials): AxiosPromise<AuthenticateResponse> {
		if (!username) {
			throw new AxiosError("Missing username. Cannot authenticate", `${HttpStatusCode.BadRequest}`);
		}
		if (!password) {
			throw new AxiosError("Missing password. Cannot authenticate", `${HttpStatusCode.BadRequest}`);
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
					[SCRAPPER_HEADERS.CONTENT_TYPE]: "application/x-www-form-urlencoded",
				},
				transformRequest: (data) => {
					return formData;
				},
			});

			if (response.status !== HttpStatusCode.Ok) {
				throw response;
			}

			const jsonCookies = this.parseAuthenticateResponse(response);

			const axiosResponse: AxiosResponse<AuthenticateResponse> = {
				...response,
				data: jsonCookies,
			};

			return axiosResponse;
		} catch (response: any) {
			const res: AxiosResponse<string> = response;
			throw res;
		}
	}

	private parseAuthenticateResponse({ data, ...response }: AxiosResponse<string>): AuthenticateResponse {
		const DEFAULT_RESPONSE = {} as AuthenticateResponse;
		const cookies = response.config.jar?.toJSON();

		return cookies ?? DEFAULT_RESPONSE;
	}
}

export default AuthController;
