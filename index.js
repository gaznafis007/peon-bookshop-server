const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();

require("dotenv").config();

app.use(express.json());
app.use(cors());

const data = require("./data/books.json");
const miniBooks = require("./data/miniBooks.json");
const reviews = require("./data/reviews.json");
const team = require("./data/team.json");

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

app.get("/books", (req, res) => {
  console.log(data);
  res.send(data);
});

app.get("/miniBooks", (req, res) => {
  res.send(miniBooks);
});

app.get("/customerReview", (req, res) => {
  res.send(reviews);
});

// app.get("/ourTeam", (req, res) => {
//   res.send(team);
// });

async function run() {
  try {
    const teamCollection = client.db("peonDB").collection("team");

    app.get("/ourTeam", async (req, res) => {
      const query = {};
      const result = await teamCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Peon server is running on port: ${port}`);
});
