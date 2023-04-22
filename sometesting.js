import fs from "fs";

fs.readFile("./0.txt", "utf8", (err, data) => {
  if (err) throw err;
  console.log(data);
});
