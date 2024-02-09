import type { Response } from 'node-fetch';

export function getEnv (key: string): string {
	const test = process.env[key]

	if (!test) {
		throw new Error(`Missing ENV var: [${key}]`)
	}

	return test
}

export function pluralize (str: string, count: number = 0, pluralization: string = 's') {
	return count > 0
		? str + pluralization
		: str;
}

export class HTTPResponseError extends Error {
	response: Response;

	constructor (response: Response) {
		super(`HTTP Error Response: ${response.status} ${response.statusText}`);
		this.response = response;
	}
}

export function checkResponseStatus (response: Response) {
	if (response.ok) {
		return response;
	}
	else {
		throw new HTTPResponseError(response);
	}
}
