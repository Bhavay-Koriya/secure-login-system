require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");

const db = require("./database");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Static files
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false
    })
);

app.use(authRoutes);
// Home Route
app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("register");
});


app.get("/login", (req, res) => {
    res.render("login");
});
app.get("/verify-otp", (req, res) => {
    res.render("verify-otp");
});

// ADD THIS CODE HERE 👇
app.get("/dashboard", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("dashboard", {
        user: req.session.user
    });

});


// Start Server
const PORT = 3000;-

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});