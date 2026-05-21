const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

const seedQuizzes = [
  {
    question: "What does the 'P' in REST stand for?",
    answer: "Nothing. REST stands for Representational State Transfer.",
    date: new Date("2026-03-20"),
    keywords: ["api", "rest"],
  },
  {
    question: "Which HTTP method is used to update an existing resource completely?",
    answer: "PUT",
    date: new Date("2026-03-22"),
    keywords: ["http", "methods"],
  },
  {
    question: "What is the default port for a MySQL database?",
    answer: "3306",
    date: new Date("2026-03-25"),
    keywords: ["database", "mysql"],
  },
  {
    question: "In Prisma, which file defines your database models?",
    answer: "schema.prisma",
    date: new Date("2026-03-26"),
    keywords: ["prisma", "backend"],
  },
];

async function main() {
  // Delete existing data (with error handling)
  try {
     await prisma.quiz.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.user.deleteMany();
  } catch (e) {
    console.log("Note: Some tables may be empty, continuing...");
  }

  // Create a default user
  const hashedPassword = await bcrypt.hash("1234", 10);
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin User",
    },
  });
  console.log("Created user:", user.email);

  // Insert seed data
  for (const quiz of seedQuizzes) {
    await prisma.quiz.create({
      data: {
        question: quiz.question,
        answer: quiz.answer,
        date: quiz.date,
        userId: user.id,
        keywords: {
          connectOrCreate: quiz.keywords.map((kw) => ({
            where: { name: kw },
            create: { name: kw },
          })),
        },
      },
    });
  }

  console.log("Quiz seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
