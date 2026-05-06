
const express = require('express'); 
const app = express();
const PORT = process.env.PORT || 3000;
const postsRouter = require("./routes/quiz");
const prisma = require("./lib/prisma");
const authRouter = require("./routes/auth");
const path = require("path");

app.use(express.static(path.join(__dirname, "..","public")));
 
// Middleware to parse JSON bodies (will be useful in later steps)
app.use(express.json());

// everything under /api/quiz
app.use("/api/quiz", postsRouter);
app.use("/api/auth", authRouter);

app.use((req, res) => {
  res.json({msg: "Not found"});
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

