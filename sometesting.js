import fs from "fs";

const readableStream = fs.createReadStream("0.mp3");

readableStream.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes of audio data.`);
  // process the audio data here
});

readableStream.on("end", (chunk) => {
  console.log("Finished reading audio file.");
  const mp3reads = fs.createWriteStream("./skjdfnskd.mp3");
  mp3reads.write(readableStream);
});
