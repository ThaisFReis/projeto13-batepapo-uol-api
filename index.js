import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient, ObjectId } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config();

// Server
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const dbUrl = process.env.DB_URL || "mongodb://localhost:5500";
const dbName = process.env.DB_NAME || "batepapoUOL";

// Database connection
const mongoClient = new MongoClient(dbUrl);
const db = mongoClient.db(dbName);

mongoClient.connect().then(() => {
    console.log('Connected to database');
}).catch(err => {
    console.log(err);
});

// Schema validation
const nameSchema = joi.object({
    name: joi.string().min(1).required()
});

/* Precisa ter para:
    from:
    to:
    text:
    type:
*/

const messageSchema = joi.object({
    from: joi.string().min(1).required(),
    to: joi.string().min(1).required(), 
    text: joi.string().min(1).required(),
    type: joi.string().valid('message', 'private_message').required()
});


// Routes

// Post user
app.post("/participants", async (req, res) => {

    // Insert participant
    const participant = req.body;

    // Validate participant
    const validation = nameSchema.validate(participant);

    if (validation.error) {
        return res.send(422); 
    }

    // Check if user already exists
    const user = await db.collection("users").findOne({ name: participant.name });

    if (user) {
        return res.send(409);
    }

    // Insert user
    await db.collection("users").insertOne({
        users: participant.name,
        lastStatus: Date.now()
    });

    // User message
    await db.collection("messages").insertOne({
        from: participant.name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format('HH:mm:ss')
    });

    res.send(201);
});

// Get users
app.get("/participants", async (req, res) => {

    // Get participants
    const result = await db.collection("users").find().toArray().then(users => {
        return users;
        }).catch(err => {
            res.status(200).send(result);
        });
});

// Get messages
app.get("/messages", async (req, res) => {

    // Get messages
    const result = await db.collection("messages").find().toArray().then(messages => {
        return messages;
        }).catch(err => {
            res.status(200).send(result);
        });
});

// Post message
app.post("/messages", async (req, res) => {

/*  Melhorar a lógica para que o usuário não possa enviar mensagens vazias;
    Melhorar como posta a mensagem*/

    // Insert message
    const message = req.body;
    const result = await db.collection("messages").insertOne(
        { message
        }
    ).then(result => {
            // Send response
        res.status(200).send("Enviado com sucesso");
    }).catch(err => {
        res.status(422).send(err);
    });
});

// Post status
app.post("/status", async (req, res) => {

    /*  Melhorar a lógica do status; */
    // Insert status
    const status = req.body;
    const result = await db.collection("status").insertOne(
        { status
        }
    ).then(result => {
        // Send response
        res.status(200).send("Enviado com sucesso");
    }).catch(err => {
        res.status(422).send(err);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
      }   
  );