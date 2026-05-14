const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

async function resetDb() {
  await prisma.solved.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();
}

async function registerAndLogin(email = "a@test.io", name = "A") {
  await request(app)
    .post("/api/auth/register")
    .send({ email, password: "pw12345", name });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "pw12345" });

  return res.body.token;
}

async function createQuiz(token, overrides = {}) {
  const res = await request(app)
    .post("/api/quiz")
    .set("Authorization", `Bearer ${token}`)
    .send({
      question: "Test question",
      answer: "Test answer",
      ...overrides
    });

  return res.body;
}

module.exports = { resetDb, registerAndLogin, createQuiz, request, app, prisma };