const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

//Formatting quizes to use the correct format
function formatQuiz(quiz) {
  return {
    ...quiz,
    date: quiz.date.toISOString().split("T")[0],
    keywords: quiz.keywords.map((k) => k.name),
  };
}


// GET /quiz
// List all quizes
router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const where = keyword
    ? { keywords: { some: { name: keyword } } }
    : {};

  const quizes = await prisma.quiz.findMany({
    where,
    include: { keywords: true },
    orderBy: { id: "asc" },
  });

  res.json(quizes.map(formatQuiz));
});



// GET /quiz/:quizId
// Show a specific quiz
router.get("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quix.findUnique({
    where: { id: quizId },
    include: { keywords: true },
  });

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  res.json(formatQuiz(quiz));
});


// POST /quiz
// Create a new quiz
router.post("/", async (req, res) => {
  const { question, answer, keywords } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ message: "question and its answer are required" });
  }

  const keywordsArray = Array.isArray(keywords) ? keywords : [];

  const newQuiz = await prisma.quiz.create({
    data: {
      question,
      answer,
      date: new Date(),
      keywords: {
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true },
  });

  res.status(201).json(formatQuiz(newQuiz));
});


// PUT /quiz/:quizId
// Edit a quiz 

router.put("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, answer, keywords } = req.body;
  const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });

  if (!existingQuiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (!question || !answer) {
    return res.status(400).json({ msg: "question and its answer are required" });
  }

  const keywordsArray = Array.isArray(keywords) ? keywords : [];

  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      question,
      answer,
      keywords: {
        set: [], 
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true },
  });

  res.json(formatPost(updatedPost));
});



// DELETE /quiz/:quizId
// Delete a quiz

router.delete("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { keywords: true },
  });

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  await prisma.quiz.delete({ where: { id: quizId } });

  res.json({
    message: "Quiz deleted successfully",
    quiz: formatQuiz(quiz),
  });
});

module.exports = router;