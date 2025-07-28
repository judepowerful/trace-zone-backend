const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function verifyToken(userId, token) {
  const decoded = jwt.verify(token, SECRET);
  if (decoded.userId !== userId) throw new Error("身份不匹配");
  return decoded;
}

module.exports = { verifyToken };
