import express from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient, ObjectId } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Database connection
const mongoClient = new MongoClient(process.env.DB_URL);
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("batepapo-uol2232222hg");
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
    const name = req.body;

    // Validate name
    const validation = nameSchema.validate(name);

    if (validation.error) {
        return res.sendStatus(422); 
    }

    // Check if user already exists
    const user = await db.collection("participants").findOne({ name: name.name });

    if (user) {
        return res.sendStatus(409);
    }

    // Insert user
    await db.collection("participants").insertOne({
        users: name.name,
        lastStatus: Date.now()
    });

    res.sendStatus(201);
});

/*
    Se o  de cima não funcionar, voltar para essa lógica
    const result = await db.collection("users").insertOne(
        { users: name }
    ).then(result => {
            // Send response
        res.status(200).send("Criado com sucesso");
    }).catch(err => {
        res.status(422).send(err);
    });
});*/

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