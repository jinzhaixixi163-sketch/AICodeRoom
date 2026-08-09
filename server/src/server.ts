import { createServer } from "node:http";
import { loadConfig } from "./config.js";
import { Database, runMigrations } from "./database.js";
import { createRequestHandler } from "./http.js";

const config = loadConfig();
const database = new Database(config.databaseUrl, config.databaseSchema);

await runMigrations(database);
const server = createServer(createRequestHandler(database, config));

server.listen(config.port, config.host, () => {
	console.log(`AICodeRoom Server listening on http://${config.host}:${config.port}`);
});

async function shutdown(): Promise<void> {
	server.close();
	await database.close();
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
