import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Bootstrap único do MVP (2 usuários fixos, 1 Space) — ver premissa em
// proposta-enciclopedia-do-bom-gosto.md: "2 contas fixas dentro de 1 Space inicial".
// Emails vêm de env pra não commitar dado pessoal no repo.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const spaceName = process.env.SEED_SPACE_NAME ?? "Casal";
  const user1Email = process.env.SEED_USER_1_EMAIL;
  const user1Name = process.env.SEED_USER_1_NAME ?? "Usuário 1";
  const user2Email = process.env.SEED_USER_2_EMAIL;
  const user2Name = process.env.SEED_USER_2_NAME ?? "Usuário 2";

  if (!user1Email || !user2Email) {
    throw new Error(
      "Defina SEED_USER_1_EMAIL e SEED_USER_2_EMAIL no .env antes de rodar o seed " +
        "(precisam ser os emails que vocês vão usar no magic link do Supabase Auth).",
    );
  }

  const space = await prisma.space.upsert({
    where: { id: "seed-default-space" },
    update: {},
    create: { id: "seed-default-space", name: spaceName },
  });

  const user1 = await prisma.user.upsert({
    where: { email: user1Email },
    update: {},
    create: { email: user1Email, name: user1Name },
  });
  const user2 = await prisma.user.upsert({
    where: { email: user2Email },
    update: {},
    create: { email: user2Email, name: user2Name },
  });

  await prisma.spaceMember.upsert({
    where: { spaceId_userId: { spaceId: space.id, userId: user1.id } },
    update: {},
    create: { spaceId: space.id, userId: user1.id, role: "OWNER" },
  });
  await prisma.spaceMember.upsert({
    where: { spaceId_userId: { spaceId: space.id, userId: user2.id } },
    update: {},
    create: { spaceId: space.id, userId: user2.id, role: "MEMBER" },
  });

  console.log(`Seed ok: Space "${space.name}" com ${user1.email} + ${user2.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
