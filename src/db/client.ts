import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type AppDatabase = ReturnType<typeof createDb>;

let database: AppDatabase | null = null;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não está definida. Configure a ligação PostgreSQL no .env"
    );
  }

  return drizzle(neon(url), { schema });
}

export function getDb(): AppDatabase {
  if (!database) {
    database = createDb();
  }
  return database;
}
