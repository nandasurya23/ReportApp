import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  const username = "pelunk";
  const passwordHash = hashPassword("@pelunk12");

  const userModelFields = prisma._runtimeDataModel.models.User?.fields ?? [];
  const hasRoleField = userModelFields.some((field) => field.name === "role");
  const hasCreatedAt = userModelFields.some((field) => field.name === "createdAt");
  const hasUpdatedAt = userModelFields.some((field) => field.name === "updatedAt");

  const now = new Date();
  const createData = {
    username,
    passwordHash,
    ...(hasRoleField ? { role: "admin" } : {}),
    ...(hasCreatedAt ? { createdAt: now } : {}),
    ...(hasUpdatedAt ? { updatedAt: now } : {}),
  };

  const updateData = {
    passwordHash,
    ...(hasRoleField ? { role: "admin" } : {}),
    ...(hasUpdatedAt ? { updatedAt: now } : {}),
  };

  await prisma.user.upsert({
    where: { username },
    update: updateData,
    create: createData,
  });

  console.log('Seed complete: default admin "pelunk" is ready.');
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
