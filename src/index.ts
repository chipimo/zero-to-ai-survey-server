import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { scoreQueries, userQueries } from './queries'; // Adjust the path as necessary

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Open SQLite database
const dbPromise = open({
  filename: './database.db',
  driver: sqlite3.Database
});

// Initialize database and create users table if it doesn't exist
dbPromise.then(async (db) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE,
      fullName TEXT,
      email TEXT UNIQUE,
      company TEXT,
      role TEXT,
      scored BOOLEAN DEFAULT 0,
      createdDate TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      score INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      questionId INTEGER NOT NULL,
      answer TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);
});

// Create a router for API routes
const apiRouter = express.Router();

// Route to create a new user
apiRouter.post("/register", async (req: Request, res: Response) => {
  const { fullName, email, company, role } = req.body;
  try {
    const uuid = await userQueries.create({ fullName, email, company, role });
    res.status(201).json({ message: "User created successfully", uuid });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

// Route to login a user
apiRouter.post("/login", async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await userQueries.getByEmail(email);
    if (user) {
      res.status(200).json({ message: "Login successful", user });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

// Route to get scores by user ID
apiRouter.get("/scores/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const scores = await scoreQueries.getByUserId(Number(userId));
    if (scores) {
      res.status(200).json(scores);
    } else {
      res.status(404).json({ message: "Scores not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error retrieving scores" });
  }
});

// Route to get scores by user UUID
apiRouter.get("/scores/uuid/:uuid", async (req: Request, res: Response) => {
  const { uuid } = req.params;
  try {
    const scores = await scoreQueries.getByUserUuid(uuid);
    if (scores) {
      res.status(200).json(scores);
    } else {
      res.status(404).json({ message: "Scores not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error retrieving scores" });
  }
});

// Route to create a score for a user
apiRouter.post("/survey/submit", async (req: Request, res: Response) => {
  const { userId, score } = req.body;
  try {
    await scoreQueries.create(userId, score);
    res.status(201).json({ message: "Score created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating score" });
  }
});

// Route to get user by UUID
apiRouter.get("/users/:uuid", async (req: Request, res: Response) => {
  const { uuid } = req.params;
  try {
    const user = await userQueries.getByUuid(uuid);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user" });
  }
});

// Use the API router with the /api prefix
app.use('/api', apiRouter);

// Start the Express app and listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});