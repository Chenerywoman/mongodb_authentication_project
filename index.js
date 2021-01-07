// npm dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// node modules
const path = require('path');

// middleware
const auth = require('./middleware/auth');

// models
const User = require('./models/userModel');
const Blog = require('./models/blogModel');

const app = express();
dotenv.config({path:'./.env'})

mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true, 
    useCreateIndex: true,
    useFindAndModify: false, 
    useUnifiedTopology: true
}).then(() => console.log('MongoDB is connected'));

const viewsPath = path.join(__dirname, '/views');
const publicDirectory = path.join(__dirname, './public');

app.set('views', viewsPath);
app.set('view engine', 'hbs');
app.use(express.static(publicDirectory));
app.use(cookieParser());

// allows passig of data
app.use(express.urlencoded({extended: false}));
app.use(express.json({extended: false}));

app.get('/register', (req, res) => {
    res.render("register")
});

app.post("/register", async (req, res) => {

    const user = await User.findOne({email: req.body.userEmail})
   
    if (req.body.userPassword != req.body.passwordConfirmation){

        res.render("register", {
            userError: true,
            message: "Your password entries do not match.  Please re-enter your details and make sure the password and password confirmation fields match."
        });

    } else if (user) {
            
        res.render("register", {
            userError: true,
            message: "The email you entered on the database already exists.  Are you already registered?  If not, please choose another email."
        });

    } else {

        const hashedPassword = await bcrypt.hash(req.body.userPassword, 8);

        await User.create({
            first_name: req.body.userName,
            surname: req.body.userSurname,
            email: req.body.userEmail,
            password: hashedPassword
        });

        res.send("you are registered");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
})

app.post("/login", async (req, res) => {

    try {
            const user = await User.findOne({email: req.body.userEmail});

            console.log(user)

            const isMatch = await bcrypt.compare(req.body.userPassword, user.password);
        
            if (isMatch) {
                const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
        
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
        
                res.cookie('jwt', token, cookieOptions)
        
                res.redirect("profile")
            
            } else {
        
                res.render("login", {
                    message: "please check your email and password are correct"
                });
            }

    } catch (error) {
        
        console.log(error)
        res.redirect("/error")

    }
  
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.get("/logout", auth.logout, (req, res) => {
    res.render("logout");
});

app.get("/error", (req, res)=> {
    res.render("error")
});

app.get('/*', (req, res) => {
    res.render("404");
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});