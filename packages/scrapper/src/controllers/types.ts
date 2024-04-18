import { Cookie } from "tough-cookie";

// JSON
export type JSONPrimitiveValues = string | boolean | number | null | Cookie.Serialized;
export type JSONValues = JSONPrimitiveValues | JSONPrimitiveValues[] | { [key: string]: JSONValues };
export type JSONResponse<R = any> = R extends unknown
	? R
	: JSONValues | Record<string, JSONValues | Record<string, JSONValues>>;

export type AvailableURLPaths = "team" | "clubhouse" | "players";
export type AvailableURLSub = "awards" | "alt";
export type FullUrlCombinations = { path: AvailableURLPaths; sub?: AvailableURLSub };

export enum SCRAPPER_HEADERS {
	ACCEPT = "Accept",
	X_REQUESTED_WITH = "X-Requested-With",
	CONTENT_TYPE = "Content-Type",
	ACCESS_CONTROL_HEADERS = "Access-Control-Expose-Headers",
}

export enum KEY_MESSAGE {
	INVALID_CREDENTIALS = "Nombre de usuario o contraseña incorrecto",
	LOGOUT = "Logout",
}
