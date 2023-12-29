const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const bookReviewCollection = client.db("peonDB").collection("bookReview");
    const wishlistCollection = client.db("peonDB").collection("wishlist");
    const orderCollection = client.db("peonDB").collection("orders");

    async function verifyAdmin(req, res, next) {
      const email = req.decoded;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role === "admin") {
        next();
      } else {
        console.log("error");
        return res.send({ message: "forbidden access" });
      }
    }
    app.get("/ourTeam", async (req, res) => {
      const query = {};
      const result = await teamCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/books", async (req, res) => {
      const page = req.query.page;
      const pageNumber = parseInt(page);
      let query = {};
      if (req.query.author) {
        const authorSearch = req.query.author;
        const authorSearchQuery = new RegExp(authorSearch, "i"); //for case insensitive
        query = { book_author: { $regex: authorSearchQuery } };
      }
      if (req.query.title) {
        const searchTerm = req.query.title;
        const searchRegex = new RegExp(searchTerm, "i");
        query = { book_title: { $regex: searchRegex } };
      }
      const count = (await booksCollection.find(query).toArray()).length;
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
    app.get("/books/:id", async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });
    app.post("/books", verifyJWT, verifyAdmin, async (req, res) => {
      const bookInfo = req.body;
      const result = await booksCollection.insertOne(bookInfo);
      res.send(result);
    });
    app.delete("/books/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });
    // app.put("/books/:id", verifyJWT, async (req, res) => {
    //   const id = new ObjectId(req.params.id);
    //   const filter = { _id: id };
    //   const updatedDocument = req.body;
    //   const options = { upsert: true };
    //   const result = await booksCollection.updateOne(
    //     filter,
    //     updatedDocument,
    //     options
    //   );
    //   res.send(result);
    // });
    app.get("/allBooks", async (req, res) => {
      let query = {};
      let page;
      let pageNumber;
      let toTalPage;
      if (req.query.title) {
        const searchedText = req.query.title;
        const title = new RegExp(searchedText, "i");
        query = { book_title: { $regex: title } };
      }
      if (req.query.author) {
        const searchedAuthor = req.query.author;
        const author = new RegExp(searchedAuthor, "i");
        query = { book_author: { $regex: author } };
      }
      const count = (await booksCollection.find(query).toArray()).length;
      if (req.query.page) {
        page = req.query.page;
        pageNumber = parseInt(page);
        toTalPage = Math.ceil(count / 12);
      }
      if (page >= toTalPage) {
        return res.send({ message: "no more books" });
      }
      const books = await booksCollection
        .find(query)
        .skip(12 * pageNumber)
        .limit(12)
        .toArray();
      res.send({ count, books });
    });
    app.get("/miniBooks", async (req, res) => {
      const query = {};
      const result = await booksCollection.find(query).limit(6).toArray();
      res.send(result);
    });
    app.get("/authors", async (req, res) => {
      const query = {};
      const authors = await booksCollection
        .find(query)
        .project({ book_author: 1 })
        .toArray();
      const uniqueAuthors = [
        ...new Set(authors.map((author) => author.book_author)),
      ];
      res.send(uniqueAuthors);
    });
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.find(query).toArray();
      if (user.length > 0) {
        console.log(user.length);
        const token = jwt.sign(email, process.env.TOKEN);
        res.send({ token });
      } else {
        res.status(401).send({ message: "unauthorized access" });
      }
    });
    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/wishlist", verifyJWT, async (req, res) => {
      const id = new ObjectId(req.query.id);
      const email = req.query.email;
      const query = { _id: id };
      const targetedUserMail = { email: email };
      const wishedBook = await booksCollection.findOne(query);
      const targetedUser = await userCollection.findOne(targetedUserMail);
      const bookForWishlist = {
        userEmail: targetedUser.email,
        userName: targetedUser.name,
        wishlistBookTitle: wishedBook.book_title,
        wishlistBookPrice: wishedBook.book_price,
        wishlistBookAuthor: wishedBook.book_author,
        wishlistBookId: wishedBook._id,
        wishlistBookImageUrl: wishedBook.book_image_url,
      };
      const result = await wishlistCollection.insertOne(bookForWishlist);
      res.send(result);
    });
    app.delete("/wishlist/:id", verifyJWT, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await wishlistCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const query = {};
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = req.query.email;
      const query = { email: email };
      const preUser = await userCollection.find(query).toArray();
      if (preUser.length > 0) {
        return res
          .status(402)
          .send({ acknowledged: false, message: "Email already in use" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.put("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const options = { upsert: true };
      const updatedDocument = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(
        query,
        updatedDocument,
        options
      );
      res.send(result);
    });
    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/admin", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    app.get("/blog", async (req, res) => {
      let query = {};
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/v2/blog", verifyJWT, async (req, res) => {
      let query = {};
      if (req.query.email) {
        if ((req.decoded = req.query.email)) {
          query = { email: req.query.email };
        } else {
          return res.status(401).send({ message: "Forbidden access" });
        }
      }
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/blog/:id", async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await blogCollection.findOne(query);
      res.send(result);
    });
    app.post("/blog", verifyJWT, async (req, res) => {
      const blog = req.body;
      const result = await blogCollection.insertOne(blog);
      res.send(result);
    });
    app.delete("/blog/:id", verifyJWT, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await blogCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/bookReview", verifyJWT, async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = { userEmail: req.query.email };
        if (req.query.email !== req.decoded) {
          return res.status(403).send({ message: "unauthorized access" });
        }
      }
      const result = await bookReviewCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/bookReview/:id", async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await bookReviewCollection.findOne(query);
      res.send(result);
    });
    app.post("/bookReview", verifyJWT, async (req, res) => {
      const bookReview = req.body;
      const result = await bookReviewCollection.insertOne(bookReview);
      res.send(result);
    });
    app.delete("/bookReview/:id", async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await bookReviewCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      const query = { userEmail: email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/allOrders", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await orderCollection.find({}).toArray();
      res.send(result);
    });
    app.put("/orders", verifyJWT, async (req, res) => {
      const order = req.body;
      console.log(order);
      const bookQuery = { _id: new ObjectId(order.bookId) };
      const orderedBook = await booksCollection.findOne(bookQuery);
      let newOrderQty = orderedBook.qty - order.orderQty;
      orderedBook.qty = newOrderQty;
      const updatedDocument = {
        $set: {
          qty: newOrderQty,
        },
      };
      const options = { upsert: true };
      const updatedBookResult = await booksCollection.updateOne(
        bookQuery,
        updatedDocument,
        options
      );
      const result = await orderCollection.insertOne(order);
      res.send({ result, updatedBookResult });
    });
    app.put("/orders/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const options = { upsert: true };
      const updatedDocument = { $set: { status: "delivered" } };
      const result = await orderCollection.updateOne(
        query,
        updatedDocument,
        options
      );
      res.send(result);
    });
    app.delete("/orders/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = new ObjectId(req.params.id);
      const query = { _id: id };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Peon server is running on port: ${port}`);
});
