const express = require("express");
const router = express.Router();

const quizes = require("../data/quiz");

// GET /quiz
// List all quizes
router.get("/", (req, res) => {
  const { keyword } = req.query;

  if (!keyword) {
    return res.json(quizes);
  }

  const filteredPosts = quizes.filter(quiz =>
    quiz.keywords.includes(keyword.toLowerCase())
  );

  res.json(filteredPosts);
});


// GET /quiz/:quizId
// Show a specific quiz
router.get("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = quizes.find((p) => p.id === quizId);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  res.json(quiz);
});

// POST /quiz
// Create a new quiz
router.post("/", (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({
      message: "question and its answer are required"
    });
  }
  const maxId = Math.max(...quizes.map(p => p.id), 0);

  const newQuiz = {
    id: quizes.length ? maxId + 1 : 1,
    question, answer,
  };
  quizes.push(newQuiz);
  res.status(201).json(newQuiz);
});

// PUT /quiz/:quizId
// Edit a quiz
router.put("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, answer } = req.body;

  const quiz = quizes.find((p) => p.id === quizId);

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (!question || !answer) {
    return res.json({
      message: "question and its answer are required"
    });
  }

  quiz.question = question;
  quiz.answer = answer;

  res.json(quiz);
});  

// DELETE /quiz/:quizId
// Delete a quiz
router.delete("/:quizId", (req, res) => {
  const quizId = Number(req.params.quizId);

  const quizIndex = quizes.findIndex((p) => p.id === quizId);

  if (quizIndex === -1) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  const deletedQuiz = quizes.splice(quizIndex, 1);

  res.json({
    message: "Quiz deleted successfully",
    post: deletedQuiz[0]
  });
});

module.exports = router;
