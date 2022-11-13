import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5500;

// Database connection
const mongoClient = new MongoClient(process.env.DB_URL);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db(process.env.DB_NAME);
}).catch(err => {
    console.log(err);
});

// Routes
app.post("/participants", async (req, res) => {
    // Insert participant
    const participant = req.body;
    const result = await db.collection("participants").insertOne(participant);

    // Send response
    res.send(result);

});












app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
      }   
  );