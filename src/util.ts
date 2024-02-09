export function getEnv (key: string): string {
	const test = process.env[key]

	if (!test) {
		throw new Error(`Missing ENV var: [${key}]`)
	}

	return test
}