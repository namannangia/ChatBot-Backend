import { PineconeClient } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config();
const pinecone = new PineconeClient();
await pinecone.init({
  environment: process.env.PINECONE_ENVIRONMENT,
  apiKey: process.env.PINECONE_API_KEY,
});

export const index = pinecone.Index("langchain");
