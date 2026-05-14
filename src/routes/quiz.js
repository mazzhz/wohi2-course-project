const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const multer = require("multer");
const path = require('path');
const { NotFoundError, ValidationError } = require("../lib/errors");
const { z } = require("zod");


const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");

const QuizInput = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

// Apply authentication to ALL routes in this router
router.use(authenticate);


const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "..", "public", "uploads" ),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new ValidationError("Only image files are allowed!"));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});





//Formatting quizes to use the correct format
function formatQuiz(quiz) {
  return {
    ...quiz,
    date: quiz.date.toISOString().split("T")[0],
    keywords: quiz.keywords.map((k) => k.name),
    userName: quiz.user ? quiz.user.name : null,
    solved: quiz.solved?.length > 0,
    likeCount: quiz._count?.likes ?? 0,
    liked: quiz.likes ? quiz.likes.length > 0 : false,
    userId: quiz.userId,
    user: undefined,
    likes: undefined,
    _count: undefined,
  };
}


// GET /quiz
// List all quizes
router.get("/", async (req, res) => {
  const { keyword } = req.query;

  const where = keyword
    ? { keywords: { some: { name: keyword } } } : {};

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
    const skip = (page - 1) * limit;

  const [quizes, totalQuizes] = await Promise.all([prisma.quiz.findMany({
      where,
      include: { keywords: true,
         user: true,
         likes: {where: { userId: req.user.userId }, take: 1},
         _count: { select: { likes: true } },

         solved: {
          where: { userId: req.user.userId },
          take: 1,
        },
      },
      orderBy: { id: "asc" },
      skip,
      take: limit,
    }), prisma.quiz.count({ where }),
  ]);
  res.json({
    data: quizes.map(formatQuiz),
    page,
    limit,
    total: totalQuizes,
    totalPages: Math.ceil(totalQuizes / limit),
  });
});


 



// GET /quiz/:quizId
// Show a specific quiz
router.get("/:quizId", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { 
      keywords: true, 
      user: true,
      likes: { where: { userId: req.user.userId }, take: 1 },
      _count: { select: { likes: true } },

      solved: {
      where: { userId: req.user.userId },
      take: 1,
     },
    },   
  });

  if (!quiz) {
    req.log.warn({ quizId }, "Quiz not found");
    throw new NotFoundError("Quiz not found");
  }

  res.json(formatQuiz(quiz));
});


// POST /quiz
// Create a new quiz
router.post("/", upload.single("image"), async (req, res) => {
  const data = QuizInput.parse(req.body);

  //if not work, previous was: if (!question || !answer) {
  if (!data.question || !data.answer) {
    req.log.warn("Attempted to create quiz with missing fields");
    throw new ValidationError("Title and content are required");
  }

  //if not work, delete data.
  const keywordsArray =
  typeof data.keywords === "string"
    ? data.keywords.split(",").map(k => k.trim()).filter(Boolean)
    : Array.isArray(data.keywords)
    ? data.keywords
    : [];

  const imageUrl = req.file 
  ? `/uploads/${req.file.filename}` 
  : null;


  const newQuiz = await prisma.quiz.create({
    data: {
      question: data.question,
      answer: data.answer,
      date: new Date(),
      userId: req.user.userId,
      imageUrl,
      keywords: {
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true,
        user: true,
        likes: { where: { userId: req.user.userId }, take: 1 },
      _count: { select: { likes: true } }
     },
  });

  res.status(201).json(formatQuiz(newQuiz));
});


// PUT /quiz/:quizId
// Edit a quiz 

router.put("/:quizId", upload.single("image"), isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { question, answer, keywords } = req.body;
  const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });

  /*
  if (!existingQuiz) {
    req.log.warn({ quizId }, "Quiz not found for update");
    throw new NotFoundError("Quiz not found");
  }*/

  if (!question || !answer) {
    req.log.warn({ quizId }, "Attempted to update quiz with missing fields");
    throw new ValidationError("Question and answer are required");
  }

  const keywordsArray =
  typeof keywords === "string"
    ? keywords.split(",").map(k => k.trim()).filter(Boolean)
    : Array.isArray(keywords)
    ? keywords
    : [];

  const imageUrl = req.file 
  ? `/uploads/${req.file.filename}` 
  : null;
  
  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      question,
      answer,
      imageUrl,
      keywords: {
        set: [], 
        connectOrCreate: keywordsArray.map((kw) => ({
          where: { name: kw },
          create: { name: kw },
        })),
      },
    },
    include: { keywords: true,
        user: true,
        likes: { where: { userId: req.user.userId }, take: 1 },
      _count: { select: { likes: true } }
     },
  });

  res.json(formatQuiz(updatedQuiz));
});



// DELETE /quiz/:quizId
// Delete a quiz

router.delete("/:quizId", isOwner, async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { keywords: true, user: true },
  });

  if (!quiz) {
    req.log.warn({ quizId }, "Quiz not found for deletion");
    throw new NotFoundError("Quiz not found");
  }

  await prisma.quiz.delete({ where: { id: quizId } });

  res.json({
    message: "Quiz deleted successfully",
    quiz: formatQuiz(quiz),
  });
});



// POST /quiz/:quizId/play
// saves the result of a quiz attempt (whether correct or not) in the database
router.post("/:quizId/play", async (req, res) => {
  const quizId = Number(req.params.quizId);
  const { answer } = req.body;
  const userId = req.user.userId;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    req.log.warn({ quizId }, "Quiz not found for play attempt");
    throw new NotFoundError("Quiz not found");
  }

  const isCorrect = quiz.answer.trim().toLowerCase() === answer.trim().toLowerCase();

  if (isCorrect) {
    // THIS SAVES THE RESULT: Upsert a record in your 'Solved' table
    // Adjust the table name (e.g., prisma.solved) based on your schema
    await prisma.solved.upsert({
      where: { userId_quizId: { userId, quizId } },
      update: {},
      create: { userId, quizId }
    });
  }

  res.json({
    correct: isCorrect,
    correctAnswer: quiz.answer
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError ||
      err?.message === "Only image files are allowed") {
    return res.status(400).json({ msg: err.message });
  }
  next(err); // pass through to global handler
});

/*
// POST /quiz/:quizId/like
// Like a quiz
router.post("/:quizId/like", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({where: { id: quizId }});
  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  const like = await prisma.like.upsert({
    where: { userId_quizId: { userId: req.user.userId, quizId } },
    update: {},
    create: { userId: req.user.userId, quizId },
  });

  const likeCount = await prisma.like.count({ where: { quizId } });

  res.status(201).json({
     id: like.id,
     quizId,
     liked: true,
     likeCount, 
     createdAt: like.createdAt,
    });
});

// DELETE /quiz/:quizId/like
// Unlike a quiz
router.delete("/:quizId/like", async (req, res) => {
  const quizId = Number(req.params.quizId);

  const quiz = await prisma.quiz.findUnique({where: { id: quizId }});
  if (!quiz) {
    throw new NotFoundError("Quiz not found");
  }

  const like = await prisma.like.deleteMany({
  where: { 
    userId: req.user.userId,
    quizId 
  },
});

  const likeCount = await prisma.like.count({ where: { quizId } });

  res.json({
     quizId,
     liked: false,
     likeCount
    });
});
*/
module.exports = router;