// utils/generateInviteCode.js
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateInviteCode(length = 6) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters[Math.floor(Math.random() * characters.length)];
  }
  return code;
}

module.exports = generateInviteCode;
