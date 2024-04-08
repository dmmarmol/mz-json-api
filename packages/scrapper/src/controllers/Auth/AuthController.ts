import cheerio from "cheerio";
import qs from "qs";
import ScrapperController from "../Scrapper/ScrapperController";

class AuthController extends ScrapperController {
	private RETRY_TIME = 5000;
	constructor() {
		super();

		this.authenticate({
			username: process.env.SCRAPPER_AUTH_USERNAME as string,
			password: process.env.SCRAPPER_AUTH_MD5_PASSWORD as string,
		});
	}

	private async authenticate({ username, password }: { username: string; password: string }) {
		if (!username) {
			throw new Error("Missing username. Cannot authenticate");
		}
		if (!password) {
			throw new Error("Missing password. Cannot authenticate");
		}

		// Construct the data payload
		// const formData = new URLSearchParams();
		// formData.append("logindata[md5]", password);
		// formData.append("logindata[username]", username);
		// // formData.append("logindata[markasdefault]", "");
		// formData.append("logindata[sport]", process.env.SCRAPPER_MZSPORT as string);
		// // const remember_me = `a:2:{s:8:"username";s:10:"${username}";s:8:"password";s:32:"${password}";}`;
		// // formData.append("logindata[remember_me]", remember_me);

		const logindata = {
			md5: password,
			username,
			sport: process.env.SCRAPPER_MZSPORT,
		};

		// // Construct the form-urlencoded string
		// const formData = Object.keys(logindata)
		//   .map((key) => `${`logindata[${key}]`}=${encodeURIComponent(logindata[key as keyof typeof logindata])}`)
		//   .join("&");

		const formData = qs.stringify({ logindata }, { encode: false });

		try {
			console.log("⏳ Ready to login");
			const response = await this.axios.post("/?p=login", formData, {
				headers: {
					"Content-type": "application/x-www-form-urlencoded",
					//   Cookie: `MZLANG=${process.env.SCRAPPER_MZLANG}; MZSPORT=${process.env.SCRAPPER_MZSPORT}; MZLOGIN=1;`,
				},
			});

			if (response.status !== 200) {
				throw new Error(response.data);
			}

			const $ = cheerio.load(response.data);
			const pageTitle = $("html head title").html();
			console.log({ pageTitle });
			//   if (pageTitle?.includes("Logout")) {
			//     console.warn(`Logged out of Managerzone. Trying again in ${this.RETRY_TIME / 1000} seconds...`);
			//     setTimeout(() => {
			//       return this.authenticate({ username, password });
			//     }, this.RETRY_TIME);
			//   } else {
			//     console.log("Login successful!");
			//     console.log(response.data);
			//     return response;
			//   }
		} catch (reason: any) {
			console.error("There was an error while loging in");
			throw new Error(reason);
		}
	}
}

export default AuthController;
