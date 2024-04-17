import { Cookie } from "tough-cookie";

// JSON
export type JSONPrimitiveValues = string | boolean | number | null | Cookie.Serialized;
export type JSONValues = JSONPrimitiveValues | JSONPrimitiveValues[] | { [key: string]: JSONValues };
export type JSONResponse<R = any> = R extends unknown
	? R
	: JSONValues | Record<string, JSONValues | Record<string, JSONValues>>;
