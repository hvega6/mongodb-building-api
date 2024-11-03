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