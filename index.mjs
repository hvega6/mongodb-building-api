import express from "express";
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import db from './db/conn.mjs';

dotenv.config();

const PORT = 5050;
const app = express();

import grades from "./routes/grades.mjs";

app.use(express.json());

app.get("/", async (req, res) => {
  let collection = db.collection("grades");
  let newDocument = {
    learner_id: 1,
    class_id: 301,
  }
  let result = await collection.insertOne(newDocument).catch( e => {
    return e.errInfo.details.schemaRulesNotSatisfied;
  });
  res.send(result).status(204);
  // res.send("Welcome to the API.");
});

app.use("/grades", grades);

// Global error handling
app.use((err, _req, res, next) => {
  console.error(err);
  res.status(500).send("Seems like we messed up somewhere...");
});

  // Update validation rules
  await db.command({
    collMod: 'grades',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['class_id', 'learner_id'],
        properties: {
          class_id: {
            bsonType: 'int',
            minimum: 0,
            maximum: 300,
            description: 'must be an integer in [0, 300] and is required'
          },
          learner_id: {
            bsonType: 'int',
            minimum: 0,
            description: 'must be an integer greater than or equal to 0 and is required'
          }
        }
      }
    },
    validationAction: 'warn'
  });

const uri = process.env.ATLAS_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to the database");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

connectToDatabase();

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
