import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Database connection
const mongoClient = new MongoClient(process.env.DB_URL);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db(process.env.DB_NAME);
}).catch(err => {
    console.log(err);
});

// Routes

// Post user
app.post("/participants", async (req, res) => {

    // Insert participant
    const name = req.body;
    const result = await db.collection("users").insertOne(
        { users: name }
    );
    
    // Send response
    res.send(result);
});

// Get users
app.get("/participants", async (req, res) => {

    // Get participants
    const result = await db.collection("users").find().toArray().then(users => {
        return users;
        }).catch(err => {
            console.log(err);
        });

    // Send response
    res.send(result);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
      }   
  );