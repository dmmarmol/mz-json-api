import AuthController from "./AuthController";
import { AxiosResponse, HttpStatusCode } from "axios";
import { JSONValues, SCRAPPER_HEADERS } from "../types";
import fs from "fs";
import path from "path";
import qs from "qs";

describe("AuthController", () => {
	const SCRAPPER_BASE_URL = "http://example.com/";
	const mockEnv = {
		SCRAPPER_BASE_URL,
	};
	process.env = { ...process.env, ...mockEnv };
	it("should authenticate successfully with mock HTML data", async () => {
		const mockFilePath = path.resolve(__dirname, "./../../../__mocks__/login.html");
		const source = fs.readFileSync(mockFilePath);
		const expectedData = {
			version: "tough-cookie@4.1.3",
			storeType: "MemoryCookieStore",
			rejectPublicSuffixes: true,
			enableLooseMode: false,
			allowSpecialUseDomain: true,
			prefixSecurity: "silent",
			cookies: [
				{
					key: "PHPSESSID",
					value: "MOCK_PHPSESSID",
					domain: "www.managerzone.com",
					path: "/",
					hostOnly: true,
					creation: "2024-04-24T00:00:00.0000",
					lastAccessed: "2024-04-24T00:00:00.0000",
				},
				{
					key: "MZLANG",
					value: "MOCK_MZLANG",
					expires: "2025-04-24T22:42:04.000Z",
					domain: "www.managerzone.com",
					path: "/",
					hostOnly: true,
					creation: "2024-04-24T00:00:00.0000",
					lastAccessed: "2024-04-24T00:00:00.0000",
				},
				{
					key: "MZLOGIN",
					value: "MOCK_MZLOGIN",
					expires: "2034-04-22T00:00:00.0000",
					domain: "www.managerzone.com",
					path: "/",
					hostOnly: true,
					pathIsDefault: true,
					creation: "2024-04-24T00:00:00.0000",
					lastAccessed: "2024-04-24T00:00:00.0000",
				},
			],
		};
		const mockAxiosResponse: AxiosResponse<JSONValues> = {
			statusText: "Mock Post Request to /?p=login",
			status: HttpStatusCode.Ok,
			config: {
				jar: {
					toJSON() {
						return expectedData;
					},
				},
			} as unknown as AxiosResponse["config"],
			headers: {
				"set-cookie": [
					"PHPSESSID=MOCK_PHPSESSID; path=/",
					"MZLANG=MOCK_MZLANG; expires=Thu, 24-Apr-2034 00:00:00 GMT; path=/",
					"MZLOGIN=MOCK_MZLOGIN; expires=Sat, 22-Apr-2034 00:00:00 GMT",
				],
			} as AxiosResponse["headers"],
			data: source,
		};

		const mockPostRequest = jest.fn().mockResolvedValueOnce(mockAxiosResponse);
		const authController = new AuthController();
		authController.axios.post = mockPostRequest;

		// Call the authenticate method
		const credentials = { username: "mock-username", password: "mock-password" };
		const axiosResponse = await authController.authenticate(credentials);

		// Assert that the authenticate method returns the expected JSON data
		await expect(axiosResponse.data).toEqual(expectedData);
		const mockFormData = qs.stringify(
			{
				logindata: {
					md5: credentials.password,
					username: credentials.username,
					sport: process.env.SCRAPPER_MZSPORT,
				},
			},
			{ encode: false }
		);
		expect(mockPostRequest).toHaveBeenCalledTimes(1);
		expect(mockPostRequest).toHaveBeenCalledWith(`${SCRAPPER_BASE_URL}?p=login`, mockFormData, {
			headers: { [SCRAPPER_HEADERS.CONTENT_TYPE]: "application/x-www-form-urlencoded" },
			transformRequest: expect.any(Function),
		});
	});
});
