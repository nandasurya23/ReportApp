import "dotenv/config";
import { defineConfig } from "prisma/config";

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
