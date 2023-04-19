import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { VectorDBQAChain } from "langchain/chains";
import { index } from "./pinecone.js";
import bodyParser from "body-parser";
import * as redirects from "https";
import FormData from "form-data";
import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import fs from "fs";

let data = new FormData();
var global_text_file_name = "0.txt";
var global_audio_file_name = "0.mp3";
dotenv.config();

function extractVideoId(url) {
  var regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  var match = url.match(regExp);
  if (match && match[7].length == 11) {
    console.log(match[7]);
    return match[7];
  } else {
    return null;
  }
}
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const router = express.Router();
app.use("/api", router);
const port = process.env.PORT || 8800;

router.post("/fromUrlToText", (req, res) => {
  if (extractVideoId(req.body.url) !== null) {
    var videoId = extractVideoId(req.body.url);
    var options = {
      method: "GET",
      url: "https://youtube-mp36.p.rapidapi.com/dl",
      params: { id: videoId },
      headers: {
        "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com",
        "X-RapidAPI-Key": `${process.env.RAPID_API_KEY}`,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        if (response.data.status != "ok") {
          res.status(500).json({ message: "Could not convert to mp3" });
        } else {
          var linkToMp3 = response.data.link;

          const file = fs.createWriteStream(global_audio_file_name);
          const request = redirects.get(linkToMp3, function (response) {
            response.pipe(file);
            file.on("finish", () => {
              {
                const file2 = fs.createReadStream(global_audio_file_name);
                if (file2) {
                  data.append("file", file2);
                  data.append("model", "whisper-1");
                  let config = {
                    method: "post",
                    maxBodyLength: Infinity,
                    url: "https://api.openai.com/v1/audio/transcriptions",
                    headers: {
                      Authorization: `Bearer ${process.env.OPEN_AI_KEY}`,
                      ...data.getHeaders(),
                    },
                    data: data,
                  };
                  axios
                    .request(config)
                    .then((response) => {
                      console.log("Data transcribed successfully!");
                      fs.writeFile(
                        global_text_file_name,
                        response.data.text,
                        (err) => {
                          if (err) throw err;
                          const textSplitter =
                            new RecursiveCharacterTextSplitter({
                              chunkSize: 200,
                              chunkOverlap: 0,
                            });
                          const embedder = new OpenAIEmbeddings();

                          (async () => {
                            const article = await fs
                              .readFileSync(global_text_file_name)
                              .toString();
                            const splittedText =
                              await textSplitter.createDocuments([article]);
                            PineconeStore.fromDocuments(
                              splittedText,
                              embedder,
                              {
                                pineconeIndex: index,
                                namespace: "langchain",
                              }
                            ).then(() => {
                              res.status(200).send("Content recieved!");
                            });
                          })();
                        }
                      );
                    })
                    .catch((error) => {
                      console.log(error);
                    });
                } else {
                  res.status(200).send("File not reading");
                }
              }
            });
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    res.status(500).json({ message: "Could not extract Video id." });
  }
});

router.post("/queryContext", async (req, res) => {
  const embedder = new OpenAIEmbeddings();
  const pineconeStore = new PineconeStore(embedder, {
    pineconeIndex: index,
    namespace: "langchain",
  });

  const model = new ChatOpenAI({
    temperature: 0.9,
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
  });

  const chain = VectorDBQAChain.fromLLM(model, pineconeStore, {
    k: 5,
    returnSourceDocuments: true,
  });
  const text = await req.body.text;
  try {
    const response = await chain.call({ query: text });
    const { text: responseText, sourceDocuments } = response;

    return res.status(200).json({
      text: responseText,
      // sources: sourceDocuments,
    });
  } catch (err) {
    console.log(err);
    res.status(404).send({ message: `${text} doesn't match any search` });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
