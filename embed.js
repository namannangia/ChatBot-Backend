import dotenv from "dotenv";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import * as fs from "fs";
dotenv.config();

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 200,
  chunkOverlap: 0,
});
import { index } from "./pinecone.js";
const embedder = new OpenAIEmbeddings();

(async () => {
  const article = await fs.readFileSync("0.txt").toString();
  const splittedText = await textSplitter.createDocuments([article]);
  PineconeStore.fromDocuments(splittedText, embedder, {
    pineconeIndex: index,
    namespace: "langchain",
  });
})();
