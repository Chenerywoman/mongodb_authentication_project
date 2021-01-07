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

    const hashedPassword = await bcrypt.hash(req.body.userPassword, 8);
    console.log(hashedPassword)

    await User.create({
        first_name: req.body.userName,
        surname: req.body.userSurname,
        email: req.body.userEmail,
        password: hashedPassword
    });

    res.send("profile created")

});


app.get('/*', (req, res) => {
    res.render("404")
});

app.listen(5000, () => {
    console.log('server running on port 5000')
});