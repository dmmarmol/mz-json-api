import { HttpStatusCode } from "axios";
import { app } from "../../app";
import { AuthController } from "scrapper";
import { Cookie } from "tough-cookie";
import http from "http";
import { RequestOptions } from "https";

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
		console.log("ERror", response);
		res.status(response.status).json(response);
	}
});

app.post("/logout", (req, res) => {
	res.clearCookie("PHPSESSID");
	res.clearCookie("MZLOGIN");
	res.clearCookie("MZLANG");
	res.status(HttpStatusCode.NoContent).end();
});

app.post("/mz-login", async (req, res) => {
	try {
		console.log("Request to mz-login...");
		const url = process.env.SCRAPPER_BASE_URL as string;
		// Combined regular expression to remove "http://", "https://" and the last trailing slash
		const host = url.replace(/^(https?:\/\/)?(.*?)\/?$/, "$2");
		// Prepare the data to be sent in the POST request
		const postData = JSON.stringify(req.body);
		const hasCookies = Object.getPrototypeOf(req.cookies) !== null;

		// Set the options for the HTTP POST request
		const options: RequestOptions = {
			hostname: host,
			path: "?p=login",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": postData.length,
				Cookie: hasCookies ? req.cookies : "",
			},
		};

		console.log(options);

		// Make the HTTP POST request
		const proxyRequest = http.request(options, (proxyResponse) => {
			let responseData = "";

			// Accumulate the data from the response
			proxyResponse.on("data", (chunk) => {
				responseData += chunk;
			});

			// Once the response is complete, send it back to the client
			proxyResponse.on("end", () => {
				const status = Number(proxyResponse.statusCode);
				res.status(status);
				// Set the response headers to match the fetched site's headers
				res.set(proxyResponse.headers);
				// Send the response data back to the client
				res.send(responseData);
			});
		});

		// Handle any errors during the request
		proxyRequest.on("error", (error) => {
			console.error("Proxy request error:", error);
			res.status(500).send("Proxy request failed");
		});

		// Send the POST data
		proxyRequest.write(postData);
		proxyRequest.end();
	} catch (response) {
		console.error("Proxy request error:", response);
		res.status(500).send("Proxy request failed");
	}
});
