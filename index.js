import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth } from "./middleware/auth.js";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = 4000;
// const MONGO_URL = "mongodb://127.0.0.1";
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("mongo is connected");

//functions
async function generateHashedPassword(password) {
  const NO_OF_ROUNDS = 10;
  const salt = await bcrypt.genSalt(NO_OF_ROUNDS);
  // console.log(salt);
  const hashedPassword = await bcrypt.hash(password, salt);
  console.log(hashedPassword);
  return hashedPassword;
}

async function createUser(data) {
  return await client.db("stackoverflow").collection("user").insertOne(data);
}

async function getUserByName(userName) {
  return await client
    .db("stackoverflow")
    .collection("user")
    .findOne({ userName: userName });
}

//data
const data = [
  {
    userName: "vishnu",
    topic: "Javascript",
    description: "What is Javascript",
    views: 0,
    votes: 0,
    answer: [
      {
        userNameAnswer: "Karthik",
        answer: "Javascript is used for building frontend webapplications",
      },
      {
        userNameAnswer: "Chandru",
        answer: "Javascript is based on line by line execution",
      },
    ],
  },
  {
    userName: "Gayathri",
    topic: "ReactJS",
    description: "What is ReactJS",
    views: 0,
    votes: 0,
    answer: [
      {
        userNameAnswer: "Sonam",
        answer: "ReactJS is the framework of Javascript",
      },
      {
        userNameAnswer: "Dhanam",
        answer: "ReactJs has SPA, Reusability, Good performance",
      },
    ],
  },
];

app.get("/pro", function (req, res) {
  res.send(data);
});

//Login
app.get("/", async (req, res) => {
  console.log(req.query);
  if (req.query.views) {
    req.query.views = +req.query.views;
  }
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .find({})
    .toArray();
  res.send(result);
});

//Home
app.get("/home", auth, async (req, res) => {
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .find({})
    .toArray();
  res.send(result);
});

app.get("/", async (req, res) => {
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .find({})
    .toArray();
  res.send(result);
});

//to post
app.post("/create", async (req, res) => {
  const data = req.body;
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .insertOne(data);
  res.send(result);
});

//get answer by id(views)
app.get("/answer/:id", async function (req, res) {
  const { id } = req.params;
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .findOne({ _id: new ObjectId(id) });
  if (result) {
    result.views = result.views + 1;
    await client
      .db("stackoverflow")
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: result });
    res.send(result);
  }
});

//get questions
app.get("/questions", async (req, res) => {
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .find({})
    .toArray();
  res.send(result);
});

//update answer
app.put("/answer/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .findOne({ _id: new ObjectId(id) });
  console.log(result);
  const res2 = result.answer;
  const res3 = res2.push(data);
  console.log(result);
  const vp = await client
    .db("stackoverflow")
    .collection("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: result });
  res.send(vp);
});

//update by id
app.put("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: data });
  res.send(result);
});

//delete
app.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

//users
app.get("/users", async (req, res) => {
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .find({})
    .toArray();
  res.send(result);
});

//tags
app.get("/tags", async (req, res) => {
  const result = await client
    .db("stackoverflow")
    .collection("users")
    .find({})
    .toArray();
  res.send(result);
});

//signup
app.post("/signup", async (req, res) => {
  const { userName, password } = req.body;
  const userFromDB = await getUserByName(userName);
  console.log(userFromDB);
  if (userFromDB) {
    res.status(400).send({ message: "UserName already exists" });
  } else if (password.length < 8) {
    res.status(400).send({ message: "Password must be atleast 8 charecters" });
  } else {
    const hashedPassword = await generateHashedPassword(password);
    const result = await createUser({
      userName: userName,
      password: hashedPassword,
    });

    res.send(result);
  }
});

//login
app.post("/login", async (req, res) => {
  const { userName, password } = req.body;
  const userFromDB = await getUserByName(userName);
  console.log(userFromDB);
  if (!userFromDB) {
    res.status(400).send({ message: "Invalid Credentials" });
  } else {
    const storedDBPassword = userFromDB.password;
    const isPasswordCheck = await bcrypt.compare(password, storedDBPassword);
    console.log(isPasswordCheck);
    if (isPasswordCheck) {
      const token = jwt.sign(
        { id: userFromDB._id },
        "dnfsdkbfkdsbfkdsbfaksjbaskfdskbdskndsk"
      );
      res.status(200).send({ message: "Login Successful", token: token });
    } else {
      res.status(401).send({ message: "Invalid Credentials" });
    }
  }
});

app.listen(port, () => {
  console.log(`server started in ${port} `);
});
