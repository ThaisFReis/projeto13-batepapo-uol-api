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
const mongoClient = new MongoClient(dbUrl,  {useUnifiedTopology: true});
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
    time:
*/

const messageSchema = joi.object({
    from: joi.string().min(1).required(),
    to: joi.string().min(1).required(), 
    text: joi.string().min(1).max(671088).required,
    type: joi.string().valid('message', 'private_message').required(),
    time: joi.string()
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

    // Get users
    const users = await db.collection("users").find().toArray().then(users => {

        // No users
        if (users.length === 0) {
            return res.send(404);
        }

        // Return users
        return res.send(users);
    }).catch(err => {
        console.log(err);
    });
});

// Post message
app.post("/messages", async (req, res) => {

    /*  Melhorar a lógica para que o usuário não possa enviar mensagens vazias;
    Melhorar como posta a mensagem*/

    const { user } = req.headers;
    const { to, text, type } = req.body;

    try {
        const message = {
            from: user,
            to,
            text,
            type,
            time: dayjs().format('HH:mm:ss')
        }

        // Validate message
        const validation = messageSchema.validate(message);

        if (validation.error) {
            return res.status(422).send(validation.error.message);
        }

        // Participant exists
        const participant = await db.collection("users").findOne({ name: user });

        if (!participant) {
            return res.status(409).send("Participant not found");
        }

        // Insert message
        await db.collection("messages").insertOne(message);
        res.send(201);
    } 
    catch (err) {
        return res.status(500).send("Internal server error");
    }

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

/*
// Post status
app.post("/status", async (req, res) => {

    /*  Melhorar a lógica do status; 
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
*/
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
      }   
  );