import cheerio from "cheerio";
import qs from "qs";
import ScrapperController from "../Scrapper/ScrapperController";

type AuthCredentials = { username: string; password: string };

class AuthController extends ScrapperController {
	private RETRY_TIME = 5000;
	constructor() {
		super();

		this.authenticate({
			username: process.env.SCRAPPER_AUTH_USERNAME as string,
			password: process.env.SCRAPPER_AUTH_MD5_PASSWORD as string,
		});
	}

	private async authenticate({ username, password }: AuthCredentials) {
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
			console.log("⏳ Ready to login");
			const response = await this.axios.post(`${this.axios.defaults.baseURL}?p=login`, formData, {
				headers: {
					"Content-type": "application/x-www-form-urlencoded",
				},
				transformRequest: (data) => {
					return formData;
				},
			});

			if (response.status !== 200) {
				throw new Error(response.data);
			}

			if (process.env.DEBUG) {
				console.log("🍪 Response Cookies");
				console.log(response.config.jar?.toJSON());
			}

			const $ = cheerio.load(response.data);
			const pageTitle = $("html head title").html();
			console.log({ pageTitle });

			if (pageTitle?.includes("Logout")) {
				console.warn(`Logged out of Managerzone. Trying again in ${this.RETRY_TIME / 1000} seconds...`);
				setTimeout(() => {
					return this.authenticate({ username, password });
				}, this.RETRY_TIME);
			} else {
				console.log("✅ Login successful!");
				console.log(`Code: ${response.status}`);
				return response;
			}
		} catch (reason: any) {
			console.error("There was an error while loging in");
			throw new Error(reason);
		}
	}
}

export default AuthController;
