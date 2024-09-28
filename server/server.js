const express = require("express");
const app = express();
const { MongoClient } = require('mongodb');
const userRequest = require("./router/userRequests");
const adminRouter = require("./router/adminRequests");
const signup = require ('./router/signup')
const session = require('express-session');

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

// ============ Session setup ============
app.use(
    session({
      secret: "secretKey",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
);

// ============ Cache prevention ============
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// ============ Authentication middleware ============
function checkAuthenticated(req, res, next) {
    if (req.session.role) { 
        if (req.session.role === 'user') {
            return res.redirect('/user');
        } else if (req.session.role === 'admin') {
            return res.redirect('/admin');
        }
    }
    next(); 
}

// ============ etting routes for users and admin ============
app.use("/user", (req, res, next) => {  // handle router
    if (!req.session.role || req.session.role !== 'user') {  
        return res.redirect('/');
    }
    next();
}, userRequest);

app.use("/admin", (req, res, next) => {
    if (!req.session.role || req.session.role !== 'admin') {
        return res.redirect('/');
    }
    next();
}, adminRouter);

app.use('/signup',signup);
app.use('/admin-user',adminRouter);



// ============ Connecting to MongoDB ============
const uri = 'mongodb://localhost:27017/';
const client = new MongoClient(uri);

async function getCredentials(role, UserInputName) {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');

        const db = client.db('user');
        const collection = db.collection('userCredentials');

        const userDetails = await collection.findOne({ role: role, username: UserInputName });

        if (!userDetails) {
            return null;
        }

        return userDetails;

    } catch (e) {
        console.error(e);
    }
}

// ============ Login page request ============
app.get("/", checkAuthenticated, (req, res) => {
    res.render("loginpage", { displayMsg: '' });
    // res.render("signup" );
});


// ============ User authentication ============
const authMiddleware = async (req, res, next) => {
    if (req.body.role === "user") {
        req.session.role = 'user';

        const dbResult = await getCredentials('user', req.body.username);

        if (dbResult) {
            const { username, password } = dbResult;

            if (username == req.body.username && password == req.body.password) {
                req.session.dbUserDetails = dbResult; 
                next(); // username and password are correct control sent to / rolebased routing
            } else {
                res.render("loginpage", { displayMsg: 'Invalid credentials' });
                return;
            }
        } else {
            res.render("loginpage", { displayMsg: 'Invalid credentials' });
            return;
        }

    } else if (req.body.role === "admin") {
        req.session.role = 'admin';

        const dbResult = await getCredentials('admin', req.body.username);

        if (dbResult) {
            const { username, password } = dbResult;

            if (username == req.body.username && password == req.body.password) {
                req.session.dbUserDetails = dbResult;
                next(); // username and password are correct control back / rolebased routing
            } else {
                res.render("loginpage", { displayMsg: 'Invalid credentials' });
                return; // stop continuing
            }
        } else {
            res.render("loginpage", { displayMsg: 'Invalid credentials' });
            return;
        }

    } else {
        res.render("loginpage", { displayMsg: '' });
    }
    next();

};

// ============ Role based Routing ============
app.post("/", authMiddleware, (req, res) => {
    if (req.session.role === "user") {
        res.redirect('/user');
    } else if (req.session.role === "admin") {
        res.redirect('/admin');
    }
});

// ============ Logout handling  ============
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Logout failed');
        }
        res.redirect("/");
    });
});


//================= server running ==================
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});


