import { OpenRouter } from "@openrouter/sdk";
import {indexTheDocment} from '../prepare.js'
import {connectToDatabase} from '../config/db.js'


import dotenv from "dotenv";
dotenv.config();

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const file = 'Opreating System .pdf';


export async function getEmbeddings() {
  const chunks = await indexTheDocment(file);

  const collection = await connectToDatabase()

  const alreadyIndex = await collection.findOne({
    fileName : file
  })


  if(alreadyIndex){
  return console.log('the file is already upload')
  }

  try {
    for (const chunk of chunks) {
      const embedding = await openrouter.embeddings.generate({
        requestBody: {
          model: "nvidia/nemotron-3-embed-1b:free",
          input: chunk,
          encodingFormat: "float",
        },
      });

     const Embedding = embedding.data[0].embedding

     await collection.insertOne({
        fileName : file,
        text : chunk,
        embedding : Embedding
        
     })


    }
  } catch (error) {
    console.error("Error generating embedding:", error);
  }
}



