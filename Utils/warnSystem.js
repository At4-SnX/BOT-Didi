const fs = require("fs");

const WARN_FILE = "./warns.json";

let warns = {};

if (fs.existsSync(WARN_FILE)) {
  warns = JSON.parse(fs.readFileSync(WARN_FILE));
}

function save() {
  fs.writeFileSync(WARN_FILE, JSON.stringify(warns, null, 2));
}

function addWarn(userId, data) {
  if (!warns[userId]) warns[userId] = [];

  warns[userId].push(data);
  save();
}

function getWarns(userId) {
  return warns[userId] || [];
}

function clearWarns(userId) {
  warns[userId] = [];
  save();
}

module.exports = {
  addWarn,
  getWarns,
  clearWarns
};