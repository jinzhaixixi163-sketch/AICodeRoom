import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

export class Database {
	readonly pool: Pool;
	readonly schema: string;

	constructor(connectionString: string, schema = "public") {
		if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("Invalid database schema");
		this.pool = new Pool({ connectionString, max: 10 });
		this.schema = schema;
	}

	async withClient<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
		const client = await this.pool.connect();
		try {
			await client.query(`SET search_path TO \"${this.schema}\"`);
			return await operation(client);
		} finally {
			client.release();
		}
	}

	async query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
		return this.withClient((client) => client.query<T>(text, values));
	}

	async close(): Promise<void> {
		await this.pool.end();
	}
}

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");

export async function runMigrations(database: Database): Promise<void> {
	await database.withClient(async (client) => {
		await client.query("BEGIN");
		try {
			await client.query(`CREATE SCHEMA IF NOT EXISTS \"${database.schema}\"`);
			await client.query(`SET search_path TO \"${database.schema}\"`);
			await client.query(
				"CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
			);
			const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
			for (const file of files) {
				const version = file.replace(/\.sql$/, "");
				const exists = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [version]);
				if (exists.rowCount) continue;
				await client.query(await readFile(path.join(migrationsDir, file), "utf8"));
				await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
			}
			await client.query("COMMIT");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		}
	});
}
