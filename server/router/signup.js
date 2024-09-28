const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb://localhost:27017/");

const createUser = async (req, res, next) => {
  try {
    await client.connect();
    console.log("db connected sucessfully for update");
    const db = client.db("user");
    const collection = db.collection("userCredentials");

    console.log(req.body);
    

    await collection.insertOne(req.body);

    res.render("loginpage", { displayMsg: "signup sucessfully you can login" });
    client.close();
  } catch (e) {
    console.log(e);
    res.render("loginpage", { displayMsg: "error please try again" });
  }
};

//=============signup page handling==============
router.get("/", (req, res) => {
  res.render("signup");
});

//==============user singin form handling===========
router.post("/", createUser, (req, res) => {});

module.exports = router;
