const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const express = require('express')


const pine = express.Router();

const pinecone = new Pinecone({
     apiKey: process.env.PINECONE_API_KEY,
})

// console.log("Pinecone indexes:", process.env.PINECONE_INDEX);
const index = pinecone.Index(`${process.env.PINECONE_INDEX}`);

// Embedding setup to convert text to embeddings

const embedding = new GoogleGenerativeAIEmbeddings({
     model: 'models/gemini-embedding-001',
     apiKey: process.env.GOOGLE_API_KEY,
});


// Large Language Model Setup

const llm = new ChatGoogleGenerativeAI({
     apiKey: process.env.GOOGLE_API_KEY_NEW,
     model: 'gemini-2.5-flash-lite',
});

pine.get('/pine', async (req, res) => {
     res.send('Pinecone API');
})



pine.post('/upload', async (req, res) => {
     const { text } = req.body;
     console.log("text", text);
     if (!text) {
          return res.status(400).send('Text is required');
     }

     // const i = await pinecone.listIndexes();
     // console.log("Pinecone indexes:", i);


     // Split the text into chunks
     // const textSplitter = new RecursiveCharacterTextSplitter({
     //      chunkSize: 500,
     //      chunkOverlap: 50,
     // });
     const docs = [{ pageContent: text }]

     console.log("docs", docs);

     try {
          await PineconeStore.fromDocuments(docs, embedding, {
               pineconeIndex: index,
               namespace: 'gemini-embedding-001',
               textKey: 'text',
          });
     } catch (error) {
          console.error("Error uploading to Pinecone:", error);
          return res.status(500).send('Error uploading text');
     }
     res.status(200).send('Text uploaded and processed');
})

pine.post('/query', async (req, res) => {
     const { query } = req.body;
     console.log("query", query);
     if (!query) {
          return res.status(400).send('Query is required');
     }

     try {

          const store = await PineconeStore.fromExistingIndex(embedding, {
               pineconeIndex: index,
               namespace: 'gemini-embedding-001',
               textKey: 'text',
          });
          console.log('store complete');

          const results = await store.similaritySearch(query, 5, {
               namespace: 'gemini-embedding-001',
          });
          console.log(" result complete. Query results:", results);

          const context = results.map(result => result.pageContent).join("\n");
          console.log("Query context:", context);

          const prompt = `
          You are a helpful assistant.  
          If the user asks about not available products in the context means say like product-name not available yet. 
          If the user asks a question related to the given context, answer it properly and shortly with the exact answer from the context.  
          If the user asks something unrelated to the context, reply: "Don't ask questions unrelated to this Farm2Home webpage."  

          If the user asks to show all products or list all products, respond with a list of all product names from the context.  
          If the user asks for product prices, show the offer price of the products from the context.  
          If the user asks for product details, give a detailed response from the context.  Dont show in stock field always.


          go shopping like request menas navigate products page
          If the user wants to navigate to a page, respond with:  
          - "navigate-home" for the home page  
          - "navigate-products" for the products page  
          - "navigate-cart" for the cart page  
          - "navigate-contact" for the contact page  
          - "navigate-order" for the order page  
           if user want to go to payment page or query similar to that means navigate to cart like previous 
          - If the user types a page name that doesn’t exist, respond with: "Unable to navigate this page."  

          If the user says "add [productname] to cart", respond with: "cart-[productname]-[1]".  
          if the user says like add 2 or 3 quantities of [productname] to cart, respond with "cart-[productname]-[quantity]".
          if user say like add all products into cart means response like "Unable to add all products to cart. add one by one."
          If the product does not exist in the context, respond with: "Product-name is not available yet." 

          if there is no related answer in the context, respond with: "Iam unable to answer this question."
          If the user asks "how many products", respond with the total number of products in the context.  

          Answer the question: ${query}\n\nContext:\n${context}\n\n`;

          console.log('template completed llm');
          console.log(process.env.GOOGLE_API_KEY);

          const response = await llm.invoke(prompt);

          console.log("LLM response:", response);

          res.status(200).json({ answer: response.text });
     } catch (error) {
          console.error("Error querying Pinecone:", error);
          res.status(500).send('Error querying text');
     }
});

module.exports = pine;