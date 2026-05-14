const prisma = require("../lib/prisma");
const { NotFoundError, ForbiddenError } = require("../lib/errors");

const isOwner = async (req, res, next) => {
    const id = Number(req.params.quizId);
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) throw new NotFoundError("Quiz not found");

    if (quiz.userId !== req.user.userId) throw new ForbiddenError("You can only modify your own quizzes");

    // Attach the record to the request so the route handler can reuse it
    req.resource = quiz;
    next();
  
};


module.exports = isOwner;
