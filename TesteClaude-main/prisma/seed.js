// prisma/seed.js
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

// Cria o adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Instancia o PrismaClient com o adapter
const prisma = new PrismaClient({ adapter });

const seedUsers = [
  { name: "Alice Admin", email: "alice@exemplo.com", password: "Admin@123456", role: "ADMIN" },
  { name: "Bruno User",  email: "bruno@exemplo.com", password: "User@123456",  role: "USER"  },
  { name: "Carla User",  email: "carla@exemplo.com", password: "User@123456",  role: "USER"  },
];

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  for (const { password, ...userData } of seedUsers) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: { ...userData, passwordHash },
    });

    console.log(`  ✅ ${user.role.padEnd(5)} | ${user.name} <${user.email}>`);
  }

  console.log("\n🔑 Credenciais de teste:");
  console.log("   ADMIN → alice@exemplo.com / Admin@123456");
  console.log("   USER  → bruno@exemplo.com / User@123456\n");
}

main()
  .catch((err) => {
    console.error("❌ Seed falhou:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());