import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Create a single grade entry
router.post("/", async (req, res) => {
  let collection = await db.collection("grades");
  let newDocument = req.body;

  // rename fields for backwards compatibility
  if (newDocument.student_id) {
    newDocument.learner_id = newDocument.student_id;
    delete newDocument.student_id;
  }

  let result = await collection.insertOne(newDocument);
  res.send(result).status(204);
});

// Get a single grade entry
router.get("/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Add a score to a grade entry
router.patch("/:id/add", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: new ObjectId(req.params.id) };

  let result = await collection.updateOne(query, {
    $push: { scores: req.body },
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Remove a score from a grade entry
router.patch("/:id/remove", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: new ObjectId(req.params.id) };

  let result = await collection.updateOne(query, {
    $pull: { scores: req.body },
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a single grade entry
router.delete("/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { _id: new ObjectId(req.params.id) };
  let result = await collection.deleteOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get route for backwards compatibility
router.get("/student/:id", async (req, res) => {
  res.redirect(`learner/${req.params.id}`);
});

// Get a learner's grade data
router.get("/learner/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { learner_id: Number(req.params.id) };

  // Check for class_id parameter
  if (req.query.class) query.class_id = Number(req.query.class);

  let result = await collection.find(query).toArray();

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a learner's grade data
router.delete("/learner/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { learner_id: Number(req.params.id) };

  let result = await collection.deleteOne(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get a class's grade data
router.get("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  // Check for learner_id parameter
  if (req.query.learner) query.learner_id = Number(req.query.learner);

  let result = await collection.find(query).toArray();

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Update a class id
router.patch("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.updateMany(query, {
    $set: { class_id: req.body.class_id },
  });

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Delete a class
router.delete("/class/:id", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let result = await collection.deleteMany(query);

  if (!result) res.send("Not found").status(404);
  else res.send(result).status(200);
});

// Get the weighted average grade for a class
router.get("/class/:id/average", async (req, res) => {
  let collection = await db.collection("grades");
  let query = { class_id: Number(req.params.id) };

  let results = await collection.find(query).toArray();

  if (!results || results.length === 0) {
    return res.send("Not found").status(404);
  }

  let totalWeightedScore = 0;
  let totalStudents = 0; // Track the number of students

  results.forEach(entry => {
    const examWeight = 0.65;
    const homeworkWeight = 0.10;
    const quizWeight = 0.25; // Remaining weight for quizzes

    // Initialize scores
    let examScore = 0;
    let homeworkScore = 0;
    let quizScore = 0;

    // Calculate scores only if they are valid numbers
    entry.scores.forEach(score => {
      if (typeof score.score === 'number') {
        if (score.type === 'exam') {
          examScore += score.score;
        } else if (score.type === 'homework') {
          homeworkScore += score.score;
        } else if (score.type === 'quiz') {
          quizScore += score.score;
        }
      }
    });

    // Calculate the weighted score only if there are scores
    if (examScore > 0 || homeworkScore > 0 || quizScore > 0) {
      let weightedScore = (examScore * examWeight) + (homeworkScore * homeworkWeight) + (quizScore * quizWeight);
      totalWeightedScore += weightedScore;
      totalStudents++; // Increment only if the student has scores
    }
  });

  // Check if there are any students with scores to avoid division by zero
  if (totalStudents === 0) {
    return res.send("No valid scores found").status(404);
  }

  let classAverage = totalWeightedScore / totalStudents; // Calculate class average

  res.send({ classAverage }).status(200);
});

export default router;
