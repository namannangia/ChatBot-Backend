import { log } from "console";
import * as https from "https";
import { MongoClient, GridFSBucket } from "mongodb";
import { PassThrough } from "stream";
import fs from "fs";

const uri = `mongodb+srv://admin:${process.env.MONGO_PASS}@cluster0.arjtg6l.mongodb.net/?retryWrites=true&w=majority`;

// Set the URL of the audio file
// const url =
//   "https://mgamma.123tokyo.xyz/get.php/5/eb/qqGadG0IBKY.mp3?cid=MmEwMTo0Zjg6YzAxMDo5ZmE2OjoxfE5BfERF&h=seOyHflgRRSwhEvaVaTx3g&s=1681945744&n=IELTS%20Listening%20Practice%20Mini%20Test%201%20_%201-minute%20English%20_%20English%20Listening%20comprehension";
// const url =
//   "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3";
const url = "./1.mp3";
// Choose a name for the file in MongoDB
const filename = "1.mp3";
const file = fs.createWriteStream(filename);

// Choose a collection to store the file in
const collectionName = "mycollection";

MongoClient.connect(uri, function (err, client) {
  if (err) throw err;
  console.log("Connected to MongoDB");
  const db = client.db("mydatabase");
  // Create a GridFSBucket for the chosen collection
  const bucket = new GridFSBucket(db, { bucketName: collectionName });

  // Use the appropriate module (http or https) to download the file
  //   const protocol = url.startsWith("https") ? https : http;
  //   const request = https.get(url);
  const request = fs.createReadStream(url);
  // Create a PassThrough stream to pipe the file data into
  const stream = new PassThrough();

  const collection = db.collection(collectionName);
  // Pipe the file data into the PassThrough stream
  if (request) {
    log("File fetched successfully from server!");
    request.pipe(stream);
  }

  // When the file has finished downloading, save it to MongoDB

  collection.findOne({ filename: "0.txt" }, function (err, result) {
    if (err) throw err;
    if (result) {
    }
  });

  stream.on("finish", function () {
    log("File rendered locally!");
    const uploadStream = bucket.openUploadStream(filename);
    stream.pipe(uploadStream);

    uploadStream.on("finish", function () {
      console.log("File saved to MongoDB.");
      const filePath = "./1.mp3";

      fs.unlink(filePath, (err) => {
        if (err) throw err;
        console.log(`${filePath} was successfully deleted`);
      });
      client.close();
    });

    uploadStream.on("error", function (err) {
      console.error("Error saving file to MongoDB:", err);
      client.close();
    });
  });
});
