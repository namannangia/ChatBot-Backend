import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import youtubeMp3Converter from "youtube-mp3-converter";
import { VectorDBQAChain } from "langchain/chains";
import { MongoClient } from "mongodb";
import { index } from "./pinecone.js";
import bodyParser from "body-parser";
import * as redirects from "https";
import FormData from "form-data";
import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";
import fs from "fs";
import { log } from "console";

const app = express();
const convertLinkToMp3 = youtubeMp3Converter("./");
app.use(bodyParser.urlencoded({ extended: true }));
var global_audio_file_name = "0.mp3";
var global_text_file_name = "0.txt";
const router = express.Router();
app.use(bodyParser.json());
let data = new FormData();
app.use("/api", router);
dotenv.config();
app.use(cors());
// const port = process.env.PORT || 8800;

const port = 8800;

router.post("/fromUrlToText", (req, res) => {
  youtubeMp3Converter("./")("https://www.youtube.com/watch?v=p5GQSf1gxbk", {
    title: "0",
  })
    .then(() => {
      {
        console.log("File writing finished");

        try {
          const file2 = fs.createReadStream("./0.mp3");
          console.log("File reading finished");
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
              fs.writeFile(global_text_file_name, response.data.text, (err) => {
                if (err) throw err;
                const textSplitter = new RecursiveCharacterTextSplitter({
                  chunkSize: 200,
                  chunkOverlap: 0,
                });
                const embedder = new OpenAIEmbeddings();

                (async () => {
                  fs.readFile("./0.txt", "utf8", async (err, dataFromFile) => {
                    if (err) throw err;
                    const splittedText = await textSplitter.createDocuments([
                      dataFromFile,
                    ]);
                    PineconeStore.fromDocuments(splittedText, embedder, {
                      pineconeIndex: index,
                      namespace: "langchain",
                    }).then(() => {
                      res.status(200).send("Content recieved!");
                    });
                  });
                })();
              });
            })
            .catch((error) => {
              console.log("Error at line 121");
              console.log(error);
            });
        } catch (err) {
          console.log("Error at 95");
          console.error(err);
        }

        const file2 = fs.createReadStream(global_audio_file_name);
      }
    })
    .catch(function (error) {
      console.log("Some error with index.js 132");
      console.error(error);
    });
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

router.get("/", async (req, res) => {
  return res.status(200).send("Server running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
