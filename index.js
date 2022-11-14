import express, { json } from 'express';
import cors from 'cors';
import dotenv from "dotenv";
import { MongoClient } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config();

// Database
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017";
const dbName = process.env.DB_NAME || "batepapoUOL";
const mongoClient = new MongoClient(dbUrl, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoClient.db(dbName);

// Database connection
mongoClient.connect().then(() => {
    db;
    console.log("Database connected");
}).catch((err) => {
    console.log(err);
});

// Server
const app = express();
app.use(cors());
app.use(json());

const PORT = process.env.PORT || 5000;


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
    text: joi.string().min(1).required(),
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
        return res.sendStatus(422); 
    }

    // Check if user already exists
    const user = await db.collection("participants").findOne({ name: participant.name });

    if (user) {
        return res.sendStatus(409);
    }

    // Insert user
    await db.collection("participants").insertOne({
        name: participant.name,
        lastStatus: Date.now()
    });

    /* Não  está retornando a seguinte informação*/
    // User message
    await db.collection("messages").insertOne({
        from: participant.name,
        to: "Todos",
        text: "entra na sala...",
        type: "status",
        time: dayjs().format('HH:mm:ss')
    });

    res.sendStatus(201);
});


// Get users
app.get("/participants", async (req, res) => {

    try{
        // Get users
        const users = await db.collection("participants").find().toArray()

        //No users
        if (!users) {
            return res.status(404).send("Users not found");
        }

        res.send(users)
        return
    }
    catch (err) {
        return res.status(500).send("Internal server error");
    }
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
        const participant = await db.collection("participants").findOne({ name: user });

        if (!participant) {
            return res.status(409).send("Participant not found");
        }

        // Insert message
        await db.collection("messages").insertOne(message);
        res.sendStatus(201);
    } 
    catch (err) {
        return res.status(500).send("Internal server error");
    }

});

// Get messages
app.get("/messages", async (req, res) => {

    try{

        const { user } = req.headers;
        const limit = parseInt(req.query.limit);

        // Get messages
        const messages = await db.collection("messages").find().toArray().then(messages => {

        // Filter messages
        const filteredMessages = messages.filter(message => {
            /* Precisa filtrar mensagens:
                Do user, Para o user e para todos */

            if (message.from === user || message.to === user || message.to === "Todos") {
                return true;
            }

            else {
                return false;
            }
        });

        // Limit messages
        if (limit ==! NaN) {
            return filteredMessages.slice(-limit);
        }

        }).catch(err => {
            return res.status(500).send(err);
        });

    }
    catch (err) {
        return res.status(500).send("Internal server error");
    }

});


// Post status
app.post("/status", async (req, res) => {
    
        const { user } = req.headers;
    
        // Participant exists
        const participant = await db.collection("participants").findOne({ name: user });

        if (!participant) {
            return res.status(409).send("Participant not found");
        }

        // Update status
        await db.collection("participants").updateOne({ name: user }, { $set: { lastStatus: Date.now() } });

        // User message
        await db.collection("messages").insertOne({
            from: user,
            to: "Todos",
            text: "sai da sala...",
            type: "status",
            time: dayjs().format('HH:mm:ss')
        });

        res.sendStatus(200);
});

//  Disconnect user

setInterval(async () => {
    let timeOut = Date.now() - 90000;

    const users = await db.collection("participants").find().toArray().then(users => {
        return users;
    }).catch(err => {
        console.log(err);
    });

    users.forEach(async user => {
        if (user.lastStatus >= timeOut) {
            await db.collection("participants").deleteOne({ name:
            user.name });

            await db.collection("messages").insertOne({
                from: user.name,
                to: "Todos",
                text: "saiu da saiu...",
                type: "status",
                time: dayjs().format('HH:mm:ss')
            });
        }
    });
}, 90000);


// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
      }   
  );