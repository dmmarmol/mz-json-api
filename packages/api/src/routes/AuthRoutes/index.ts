import { StatusCodes } from "http-status-codes";
import { app } from "../../app";
import { AuthController } from "scrapper";
import { Cookie } from "tough-cookie";

function getSerializedCookies(cookies: Cookie.Serialized[], cookieKeyMap: (keyof Cookie.Properties)[] = []): string[] {
	const serializedCookies: string[] = cookies.map((cookie) => {
		const cookieProps: string = cookieKeyMap.reduce((acc, key) => {
			const value = cookie[key];
			if (!value) {
				return acc;
			}

			return `${acc}${key}=${value};`;
		}, "");
		const cookieValue = `${cookie.key}=${cookie.value}; ${cookieProps}`;
		return cookieValue;
	});

	return serializedCookies;
}

app.post("/login", async (req, res) => {
	try {
		const credentials = {
			username: req.body["username"],
			password: req.body["password"],
		};
		const authController = new AuthController();
		const response = await authController.authenticate(credentials);

		const cookies = response.data.cookies;
		const serializedCookies = getSerializedCookies(cookies, [
			"expires",
			// "path",
			// "domain"
		]);

		res.writeHead(response.status, {
			"set-cookie": serializedCookies,
		});
		res.end(JSON.stringify(response.data));
	} catch (response: any) {
		res.status(response.status).json(response);
	}
});

app.post("/logout", (req, res) => {
	res.clearCookie("PHPSESSID");
	res.clearCookie("MZLOGIN");
	res.clearCookie("MZLANG");
	res.status(StatusCodes.NO_CONTENT).end();
});
