const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../database");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// Register
router.post("/register", async (req, res) => {

    const { username, email, password } = req.body;
    console.log(req.body);
    db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        async (err, result) => {

            if (result.length > 0) {
                return res.send("Email already exists.");
            }

            const hash = await bcrypt.hash(password, 10);

            db.query(
                "INSERT INTO users(username,email,password) VALUES(?,?,?)",
                [username, email, hash],
                (err) => {

                    if (err) return res.send(err);

                    res.redirect("/login");
                }
            );

        }
    );

});

// Login
router.post("/login", (req, res) => {

    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        async (err, result) => {

            if (result.length == 0) {
                return res.send("User not found");
            }

            const user = result[0];

            const match = await bcrypt.compare(password, user.password);

            if (!match) {
                return res.send("Wrong Password");
            }

            const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
});

const expiry = new Date(Date.now() + 5 * 60 * 1000);

db.query(
    "UPDATE users SET otp=?, otp_expiry=? WHERE id=?",
    [otp, expiry, user.id]
);

await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Your Login OTP",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`
});

req.session.tempUser = user.id;

res.redirect("/verify-otp");
        }
    );

});
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});
router.get("/verify-otp", (req, res) => {
    res.render("verify-otp");
});

router.post("/verify-otp", (req, res) => {
    const { otp } = req.body;

    db.query(
        "SELECT * FROM users WHERE id=?",
        [req.session.tempUser],
        async (err, result) => {
            if (result.length == 0) {
                return res.send("User not found");
            }

            const user = result[0];

            if (
                user.otp === otp &&
                new Date(user.otp_expiry) > new Date()
            ) {
                req.session.user = user;
                delete req.session.tempUser;
                return res.redirect("/dashboard");
            }

            res.send("Invalid or Expired OTP");
        }
    );
});
module.exports = router;