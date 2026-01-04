const webPush = require("web-push");

const ErrorResponse = require("./errorResponse");
const crypto = require("crypto");
// ** Checks if an object is empty (returns boolean)
const isObjEmpty = (obj) => {
  return Object?.keys(obj).length === 0;
};

const jsonFormat = (obj) => {
  const object = JSON.parse(JSON.stringify(obj));
  return object;
};

function generateRandomPassword(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// generate plain token and hashed version
function createInviteToken() {
  const plain = crypto.randomBytes(20).toString("hex"); // send this
  const hash = crypto.createHash("sha256").update(plain).digest("hex"); // store hashed
  return { plain, hash };
}

// validate provided plain token against stored hash
function hashToken(plain) {
  return crypto.createHash("sha256").update(plain).digest("hex");
}
function generateKey() {
  return crypto.randomBytes(32).toString("hex");
}

module.exports = {
  isObjEmpty,
  jsonFormat,
  generateKey,
  generateRandomPassword,
  createInviteToken,
  hashToken,
};
