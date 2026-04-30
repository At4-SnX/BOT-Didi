const fs = require("fs");

function saveData(data) {
  fs.writeFileSync("./data/warns.json", JSON.stringify(data, null, 2));
}