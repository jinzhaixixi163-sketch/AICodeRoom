export type ServerConfig = {
	databaseUrl: string;
	databaseSchema: string;
	host: string;
	port: number;
	allowedOrigins: Set<string>;
	sessionTtlSeconds: number;
};

const SCHEMA_PATTERN = /^[a-z_][a-z0-9_]*$/;

function integerFromEnv(value: string | undefined, fallback: number, name: string): number {
	if (value === undefined || value.trim() === "") return fallback;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
	return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
	const databaseSchema = env.AICODEROOM_DATABASE_SCHEMA?.trim() || "public";
	if (!SCHEMA_PATTERN.test(databaseSchema)) throw new Error("AICODEROOM_DATABASE_SCHEMA is invalid");

	const allowedOrigins = new Set(
		(env.AICODEROOM_ALLOWED_ORIGINS || "app://renderer,http://127.0.0.1:5173,http://localhost:5173")
			.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean),
	);

	return {
		databaseUrl: env.AICODEROOM_DATABASE_URL?.trim() || "postgresql:///aicoderoom_dev",
		databaseSchema,
		host: env.AICODEROOM_HOST?.trim() || "127.0.0.1",
		port: integerFromEnv(env.AICODEROOM_PORT, 8788, "AICODEROOM_PORT"),
		allowedOrigins,
		sessionTtlSeconds: integerFromEnv(env.AICODEROOM_SESSION_TTL_SECONDS, 60 * 60 * 24 * 30, "AICODEROOM_SESSION_TTL_SECONDS"),
	};
}
