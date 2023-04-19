import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://admin:admin@cluster0.arjtg6l.mongodb.net/?retryWrites=true&w=majority";

MongoClient.connect(uri, function (err, client) {
  if (err) throw err;

  const db = client.db("mydatabase");
  const collection = db.collection("mycollection");

  const contents = "Hello World";
  const buffer = Buffer.from(contents);

  const document = {
    filename: "0.txt",
    contents: buffer,
  };

  collection.findOne({ filename: "0.txt" }, function (err, result) {
    if (err) throw err;

    if (result) {
      collection.updateOne(
        { filename: "0.txt" },
        { $set: { data: buffer } },
        function (err, result) {
          if (err) throw err;
          collection.findOne({ filename: "0.txt" }, function (err, result) {
            if (err) throw err;
            const buffer = result.data;
            const contents = buffer.toString();
            console.log(contents);
            client.close();
          });
        }
      );
    } else {
      collection.insertOne(document, function (err, result) {
        if (err) throw err;
        collection.findOne({ filename: "0.txt" }, function (err, result) {
          if (err) throw err;
          const buffer = result.data;
          const contents = buffer.toString();
          console.log(contents);
          client.close();
        });
      });
    }
  });
});
