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

// helper function
const helpers = require('./helpers')

// models
const User = require('./models/userModel');
const Blog = require('./models/blogModel');
const { RSA_NO_PADDING } = require('constants');
const { registerHelper } = require('hbs');

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

app.get('/', (req, res) => {
    res.render("index.hbs")
});

app.post("/register", auth.isLoggedIn, async (req, res) => {
    
    if (!req.userFound){

        try {
            const user = await User.findOne({email: req.body.userEmail})
        
            if (req.body.userPassword != req.body.passwordConfirmation){

                res.render("register", {
                    userError: true,
                    message: "Password entries do not match.  Please re-enter your details and make sure the password and password confirmation fields match."
                });

            } else if (user) {
                    
                res.render("register", {
                    userError: true,
                    message: "The email you entered on the database already exists. Are you sure you are not already registered?  If not, please input a different email."
                });

            } else {

                const hashedPassword = await bcrypt.hash(req.body.userPassword, 8);

                const newUser = await User.create({
                    first_name: req.body.userName,
                    surname: req.body.userSurname,
                    email: req.body.userEmail,
                    password: hashedPassword
                });

                helpers.createCookie(newUser._id, res)
            
                res.redirect("profile");
            }

        } catch (error) {
            console.log(error)
            res.redirect("/error")
        }
    } else {
        res.redirect("/*")
    }
});

app.get("/admin", auth.isLoggedIn, (req, res) => {

    if (req.userFound && req.userFound.admin){
        res.render("admin")

    } else {
        res.redirect("/*")
    }

});

app.post("/admin", auth.isLoggedIn, async (req, res) => {

    try {
        const user = await User.findOne({ email: req.body.userEmail })

        if (req.body.userPassword != req.body.passwordConfirmation) {

            res.render("admin", {
                message: "The password entries do not match.  Please re-enter the details and make sure the password and password confirmation fields match."
            });

        } else if (user) {

            res.render("admin", {
                message: "The email you entered on the database already exists.  Is the user already registered?  If not, please choose another email."
            });

        } else {

            const hashedPassword = await bcrypt.hash(req.body.userPassword, 8);

            const newUser = await User.create({
                first_name: req.body.userName,
                surname: req.body.userSurname,
                email: req.body.userEmail,
                password: hashedPassword
            });
            console.log("new user")
            console.log(newUser)
            res.render("admin", {
                message: `user ${newUser.first_name} ${newUser.surname} registered`
            });
        }

    } catch (error) {
        console.log(error)
        res.redirect("/error")
    }

});

app.get("/login", auth.isLoggedIn, (req, res) => {
    
    if (req.userFound) {
        
        res.redirect("/profile")

    } else {
        res.render("login");
    }
})

app.post("/login", async (req, res) => {

    try {   
            const user = await User.findOne({email: req.body.userEmail});

            const isMatch = await bcrypt.compare(req.body.userPassword, user.password);
        
            if (isMatch) {

                helpers.createCookie(user._id, res)
              
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

app.get("/profile", auth.isLoggedIn, (req, res) => {

    if (req.userFound){

        const admin = req.userFound.admin ? true : false

        res.render("profile", {
            first_name: req.userFound.first_name,
            surname: req.userFound.surname,
            email: req.userFound.email,
            admin: admin
        });

    } else {

        res.redirect("/login");
    }
});

app.get("/update", auth.isLoggedIn, (req, res) => {

    if (req.userFound) {

        res.render("update", {
            first_name: req.userFound.first_name,
            surname: req.userFound.surname,
            email: req.userFound.email, 
            password: req.userFound.password

        })
    } else {

        res.redirect("/login")
    }
});

app.post("/update", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) { 

        const hashedPassword = await bcrypt.hash(req.body.password, 8);

        try {
           
          await User.findByIdAndUpdate(req.userFound._id, {
                first_name: req.body.first_name, 
                surname: req.body.surname, 
                email: req.body.email,
                password: hashedPassword
            });

            res.redirect("/profile")

        } catch (error) {
            console.log(error)
            res.redirect(error)
        }

    } else {
        res.redirect("/login")
    }
});

app.get("/update/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin) {

        try {

            const userToUpdate = await User.findOne({_id: req.params.id})
            console.log(userToUpdate)

            res.render("update", {
                first_name: userToUpdate.first_name,
                surname: userToUpdate.surname,
                email: userToUpdate.email, 
                password: userToUpdate.password
    
            })

        } catch (error) {
            console.log(error)
            res.redirect("/error")

        }
    
    } else {

        res.redirect("/*")
    }
});

app.post("/update/:id", auth.isLoggedIn, async (req, res) => {
    console.log("in id update")
    if (req.userFound && req.userFound.admin) { 

        const hashedPassword = await bcrypt.hash(req.body.password, 8);

        try {
           
          await User.findByIdAndUpdate(req.body.id, {
                first_name: req.body.first_name, 
                surname: req.body.surname, 
                email: req.body.email,
                password: hashedPassword
            });

            res.redirect("/allusers")

        } catch (error) {
            console.log(error)
            res.redirect(error)
        }

    } else {
        res.redirect("/login")
    }
});

app.post("/delete", auth.isLoggedIn, async (req, res) => {
   
    if (req.userFound) {

        try {
            const deleted = await User.findByIdAndDelete(req.userFound._id);
            console.log(deleted)
            res.render("deleted", {
                message: `${deleted.first_name} ${deleted.surname} has been deleted from the database`
            });

        } catch (error) {
                console.log(error)
                res.render("error");
        }

    } else {
        console.log(error)
        res.redirect("error")
    }
});

app.post("/delete/:id", auth.isLoggedIn, async (req, res) => {
        console.log("in delete post")
        console.log(req.params.id)
    if (req.userFound && req.userFound.admin){

        try {

            const deleted = await User.findByIdAndDelete(req.params.id)
            console.log(deleted)
            res.render("deleted", {
                message: `${deleted.first_name} ${deleted.surname} has been deleted from the database`
            });

        } catch (error) {

            console.log(error);
            res.redirect("error")
        }

    } else {
        res.redirect("/allusers")
    }
});

app.get("/allusers", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        if (req.userFound.admin) {

            try {

                const users = await User.find()

                res.render("allusers", {
                    users: users
                })

            } catch (error) {
                console.log(error)
                res.redirect("/error")
            }

        } else {
            res.render("allusers")
        }

    } else {
        res.redirect("/login")
    }
});

app.get("/newblog", auth.isLoggedIn, (req, res) => {

    if (req.userFound) {

        res.render("newblog");

    } else {

        res.redirect("/login");
    }
});

app.post("/newblog", auth.isLoggedIn, async (req, res) => {

    try {
        const newblog = await Blog.create({
            title: req.body.title,
            body: req.body.blog,
            user: req.userFound._id
        });

        res.redirect("/userblogs")

    } catch (error) {
        console.log(error)
        res.redirect("/error")

    }

});

app.get("/userblogs", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        const myblogs = await Blog.find({user:req.userFound._id}).populate('user', 'first_name surname');
        console.log('my blogs')
        console.log(myblogs)
        res.render("userblogs", {
            blogs: myblogs, 
            ownblogs: true
        });

    } else {

        res.redirect("/login");
    }
});

app.get("/allblogs", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin) {
        
        try {

            const allblogs = await Blog.find().populate('user', 'first_name surname')

            res.render("userblogs", {
                blogs: allblogs
            });

        } catch (error) {
            console.log(error)
            res.redirect("/error")
        }

    } else {

        res.redirect("/*")
        
    }
});

app.get("/updateblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound){

        const blogToUpdate = await Blog.findById({_id: req.params.id})

        res.render("updateblog", {
            id: req.params.id,
            title: blogToUpdate.title,
            blog: blogToUpdate.body
        })

    } else {

        res.render("/login")
    }
});

app.post("/updateblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        try {
            console.log('req.params')
            console.log(req.params.id)
            const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
                title: req.body.title,
                body: req.body.blog
            })

            res.redirect("/userblogs")

        } catch (error) {

            console.log(error);
            res.redirect("/error")

        }
        

    } else {
        res.redirect("/login")
    }
})

app.post("/deleteblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        try {

            deletedBlog = await Blog.findByIdAndDelete({_id:req.params.id})

            console.log(deletedBlog)

            res.render("deleted", {
                message: `blog ${deletedBlog.title} was deleted`
            })

        } catch (error) {
            console.log(error)
            res.redirect("error");
        }

    } else {
        
        res.redirect("login")
    }

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