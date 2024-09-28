
const express = require("express");
const router = express.Router();
const { MongoClient } = require("mongodb");

const client = new MongoClient("mongodb://localhost:27017/");

//============getting all users details from Database for admin pannel==========================
const getAllUser = async (req, res, next) => {
  try {
    await client.connect();
    console.log("db connected to fetch user data");
    const db = client.db("user");
    const collection = db.collection("userCredentials");

    const allUsers = await collection.find({ role: "user" }).toArray();//fetching data fron DB
    req.session.allUsers = allUsers; 
    client.close();
    next();
  } catch (e) {
    console.log(e);
    res.render("loginpage", { displayMsg: "error please try again" });
  }
};

//===============user delete middileware====================
const deleteuser = async (req, res, next) => {
  try {
    await client.connect();
    const db = client.db("user");
    const collection = db.collection("userCredentials");
    const username = req.params.username;

    await collection.deleteOne({ username: username, role: "user" });
    next();
  } catch (e) {
    
  }
};

//============delete request=================
const userEdit = async (req, res, next) => {
  await client.connect();
  const db = client.db("user");
  const collection = db.collection("userCredentials");
  const username = req.params.username;

  const userDetails = await collection.findOne({
    username: username,
    role: "user",
  });

  req.session.userDetails = userDetails;
  next();
};

// update middileware================
const update = async (req, res, next) => {
  if (req.session.role === "admin") {
    await client.connect();
    const db = client.db("user");
    const collection = db.collection("userCredentials");
    console.log(req.body);

    const username = req.body.username;
    const data = req.body;
    const update = { $set: data };

    await collection.updateOne({ username: username, role: "user" }, update);
    next();
  } else {
    next();
    console.log("error");
  }
};

//=========================== adding user============================
const createUser = async (req, res, next) => {
  if (req.session.role === "admin") {
    try {
      await client.connect();
      console.log("db connected sucessfully for adding ");
      const db = client.db("user");
      const collection = db.collection("userCredentials");

      await collection.insertOne(req.body);
      client.close();
      console.log("user added sucessfully");

      next();
    } catch (e) {
      console.log(e);
      res.render("loginpage", { displayMsg: "errorwhile adding user" });
    }
  } else {
    res.redirect("/");
  }
};

const search = async (req,res,next)=>{
    
  if (req.session.role === "admin") {
    try {
      await client.connect();
      console.log("db connected sucessfully for searching ");
      const db = client.db("user");
      const collection = db.collection("userCredentials");

      const dbResult = await collection.findOne(req.body);
        
      req.session.dbResult = dbResult;
      client.close();
      next();

    } catch (e) {
      console.log(e);
      res.render('adminPannel');
    }
  } else {
    res.render('adminPannel');
  }

}

//====================================request handlers===================================
//============== admin page loading ==============
router.get("/", getAllUser, (req, res) => {
  if (req.session.role === "admin") {
    const allUsers = req.session.allUsers;
    res.render("adminPannel", { allUsers });
  } else {
    res.render("loginpage");
  }
});

//============delete request=================
router.post("/delete/:username", deleteuser, (req, res) => {
  res.redirect("/");
});

//==========editing =================
router.post("/edit/:username", userEdit, (req, res) => {
  if (req.session.userDetails) {
    const userDetails = req.session.userDetails;
    res.render("userediting", { userDetails });
  } else {
    res.redirect("/");
  }
});

// ===============confirming edit by admin ============
router.post("/submitedit/:username", update, (req, res) => {
  res.redirect("/");
});

//===========render editing page============
router.post("/adduserreq", (req, res) => {
  res.render("useradding");
});

router.post("/adduser", createUser, (req, res) => {
  res.redirect("/");
});
//===================search==================
router.post('/search',search,(req,res)=>{
  if(req.session.dbResult){

    const allUsers=[];
    allUsers.push(req.session.dbResult)
    console.log(allUsers);
    res.render('adminPannel',{allUsers});
  }else{
   const allUsers = [];
    res.render('adminPannel',{allUsers});
  }
  
})

module.exports = router;
