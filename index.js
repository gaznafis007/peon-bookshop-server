const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

require("dotenv").config();

app.use(express.json());
app.use(cors());

const data = require("./data/books.json");
const miniBooks = require("./data/miniBooks.json");
const reviews = require("./data/reviews.json");
const team = require("./data/team.json");

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

app.get("/ourTeam", (req, res) => {
  res.send(team);
});

app.listen(port, () => {
  console.log(`Peon server is running on port: ${port}`);
});
