import { MongoClient, ObjectId } from "mongodb";
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.ATLAS_URI) {
  throw new Error("ATLAS_URI environment variable is not defined");
}

const client = new MongoClient(process.env.ATLAS_URI);

let conn;
try {
  conn = await client.connect();
  console.log("Connected to MongoDB");

  let db = conn.db("sample_training");
  let collection = db.collection("grades");

  // Create single-field indexes
  await collection.createIndex({ class_id: 1 });
  await collection.createIndex({ learner_id: 1 });

  // Create compound index
  await collection.createIndex({ learner_id: 1, class_id: 1 });

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
  
} catch (e) {
  console.error(e);
  process.exit(1); // Exit the application if the connection fails
}

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to the database");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

export default conn.db("sample_training"); // Exporting the db directly