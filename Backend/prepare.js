import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { getEmbeddings } from "./embeddings/embeddingService.js";
// import { saveDocumentToMongoDB } from "./services/storageService.js";


export async function indexTheDocment(filePath) {
  const loader = new PDFLoader(filePath, { splitPages: false });
   const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(docs);
  return chunks.map((doc) => doc.pageContent);

}
