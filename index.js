const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");

// JWT_Token

require("dotenv").config();

app.use(express.json());
app.use(cors());

// const data = require("./data/books.json");
// const miniBooks = require("./data/miniBooks.json");
const reviews = require("./data/reviews.json");
// const team = require("./data/team.json");

// MIDDLEWARE
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).send({ message: "forbidden access" });
  }
  const auth = authHeader.split(" ")[1];
  console.log(authHeader, auth);
  jwt.verify(auth, process.env.TOKEN, (error, decoded) => {
    if (error) {
      console.log(error);
      res.status(401).send({ message: "unauthorized" });
    }
    req.decoded = decoded;
    next();
  });
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sahqxic.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Peon server is running");
});

// app.get("/books", (req, res) => {
//   console.log(data);
//   res.send(data);
// });

// app.get("/miniBooks", (req, res) => {
//   res.send(miniBooks);
// });

app.get("/customerReview", (req, res) => {
  res.send(reviews);
});

// app.get("/ourTeam", (req, res) => {
//   res.send(team);
// });

async function run() {
  try {
    const teamCollection = client.db("peonDB").collection("team");
    const booksCollection = client.db("peonDB").collection("books");
    const userCollection = client.db("peonDB").collection("users");
    const blogCollection = client.db("peonDB").collection("blogs");

    app.get("/ourTeam", async (req, res) => {
      const query = {};
      const result = await teamCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/books", async (req, res) => {
      const page = req.query.page;
      const pageNumber = parseInt(page);
      const query = {};
      const count = await booksCollection.estimatedDocumentCount();
      const totalPage = Math.ceil(count / 12);
      if (page >= totalPage) {
        res.send({ message: "no more books" });
      } else {
        const books = await booksCollection
          .find(query)
          .skip(12 * pageNumber)
          .limit(12)
          .toArray();
        res.send({ count, books });
      }
    });
    app.get("/miniBooks", async (req, res) => {
      const query = {};
      const result = await booksCollection.find(query).limit(6).toArray();
      res.send(result);
    });
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.find(query).toArray();
      console.log(user);
      if (user.length > 0) {
        console.log(user.length);
        const token = jwt.sign(email, process.env.TOKEN);
        res.send({ token });
      } else {
        res.status(401).send({ message: "unauthorized access" });
      }
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = req.query.email;
      const query = { email: email };
      const preUser = await userCollection.find(query).toArray();
      console.log(preUser.length);
      if (preUser.length > 0) {
        return res
          .status(402)
          .send({ acknowledged: false, message: "Email already in use" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/blog", async (req, res) => {
      const query = {};
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/blog", verifyJWT, async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Peon server is running on port: ${port}`);
});
