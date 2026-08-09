import { loadConfig } from "./config.js";
import { Database, runMigrations } from "./database.js";

const config = loadConfig();
const database = new Database(config.databaseUrl, config.databaseSchema);

try {
	await runMigrations(database);
	console.log(`AICodeRoom database schema '${config.databaseSchema}' is up to date.`);
} finally {
	await database.close();
}
