import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let client = null;
let collection = null;

export async function connectToDatabase() {
  if (collection) {
    return collection;
  }

  const uri = process.env.MongoDB;
  if (!uri) {
    throw new Error("MongoDB connection string missing in environment variables!");
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    const database = client.db("DocsSynth");
    collection = database.collection("Private_DOCS");
    console.log("Connected to MongoDB successfully!");
    return collection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}