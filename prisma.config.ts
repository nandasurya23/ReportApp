import { defineConfig } from "prisma/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFileIfExists(fileName: string) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) {
    return;
  }
  process.loadEnvFile(path);
}

// Local precedence: .env.local (dev DB) -> .env fallback
loadEnvFileIfExists(".env.local");
if (!process.env.DATABASE_URL) {
  loadEnvFileIfExists(".env");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
