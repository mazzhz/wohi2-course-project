const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;
const { UnauthorizedError, ForbiddenError } = require("../lib/errors");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    throw new UnauthorizedError("No token provided");

  const token = authHeader.split(" ")[1];
  
  try {
   const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new ForbiddenError("Invalid or expired token");
  }
}


/*
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
} */


module.exports = authenticate;