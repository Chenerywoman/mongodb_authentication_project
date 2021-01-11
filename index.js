// npm dependencies
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const hbs = require("hbs");
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

const app = express();
dotenv.config({path:'./.env'})

mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true, 
    useCreateIndex: true,
    useFindAndModify: false, 
    useUnifiedTopology: true
}).then(() => console.log('MongoDB is connected'));

const viewsPath = path.join(__dirname, '/views');
const partialPath = path.join(__dirname, "views/inc");
const publicDirectory = path.join(__dirname, './public');

app.set('views', viewsPath);
app.set('view engine', 'hbs');
hbs.registerPartials(partialPath);
app.use(express.static(publicDirectory));
app.use(cookieParser());

// allows passig of data
app.use(express.urlencoded({extended: false}));

// not needed as not json data received
// app.use(express.json());

app.get('/', auth.isLoggedIn, (req, res) => {

    if(req.userFound && req.userFound.admin){

    res.render("index", {
        admin: req.userFound.admin
    }) } else {
        res.render("index")
    }
});

app.get('/register', auth.isLoggedIn, (req, res) => {

    if (!req.userFound){

        res.render("register")

    } else {

        res.redirect("/registered")
    }
    
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
            
                res.redirect("/profile");
            }

        } catch (error) {
            console.log(error)
            res.redirect("/error")
        }
    } else {
        res.redirect("/profile")
    }
});

app.get("/registered", (req, res) => {

    res.render("registered")
});

app.get("/admin-register", auth.isLoggedIn, (req, res) => {

    if (req.userFound) {

        if (req.userFound.admin){
            res.render("admin_register", {
                admin: req.userFound.admin
            })
    
        } else {
            res.redirect("/not-admin")
        }

    } else {
        
        res.redirect("/not-logged-in")
    }

});

app.post("/admin-register", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin) {
        console.log('in admin')
        
        try {
            const user = await User.findOne({ email: req.body.userEmail })

            if (req.body.userPassword != req.body.passwordConfirmation) {

                res.render("admin_register", {
                    message: "The password entries do not match.  Please re-enter the details and make sure the password and password confirmation fields match.",
                    admin: req.userFound.admin
                });

            } else if (user) {

                res.render("admin_register", {
                    message: "The email you entered on the database already exists.  Is the user already registered?  If not, please choose another email.",
                    admin: req.userFound.admin
                });

            } else {

                const hashedPassword = await bcrypt.hash(req.body.userPassword, 8);
                const admin = req.body.admin == "yes" ? true : false

                const newUser = await User.create({
                    first_name: req.body.userName,
                    surname: req.body.userSurname,
                    email: req.body.userEmail,
                    password: hashedPassword,
                    admin: admin
                });
                console.log("new user")
                console.log(newUser)

                res.render("admin_register", {
                    message: `user ${newUser.first_name} ${newUser.surname} registered`,
                    admin: req.userFound.admin
                });
            }

        } catch (error) {
            console.log(error)
            res.redirect("/error")
        }

    } else {
        res.redirect("/not-admin")
    }

});

app.get("/login", auth.isLoggedIn, (req, res) => {
    
    if (req.userFound) {
        
        res.redirect("/logged-in")

    } else {
        res.render("login");
    }
})

app.post("/login", async (req, res) => {

    try {
        const user = await User.findOne({
            email: req.body.userEmail
        });

        if (user) {

            const isMatch = await bcrypt.compare(req.body.userPassword, user.password);

            if (isMatch) {

                helpers.createCookie(user._id, res)

                if (user.admin) {

                    res.redirect("/admin-profile")

                } else {

                    res.redirect("/profile")

                }

                // res.redirect("profile")

            } else {

                res.render("login", {
                    message: "please check your email and password are correct"
                });
            }

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

app.get("/logged-in", auth.isLoggedIn, (req, res) => {

    if (req.userFound){
        res.render("logged_in", {
            admin: req.userFound.admin
        });
    } else {
        res.redirect("error")
    }
    
});

app.get("/profile", auth.isLoggedIn, (req, res) => {

    if (req.userFound){

        const admin = req.userFound.admin ? true : false

        if (admin) {

            res.redirect("/admin-profile")

        } else {

            res.render("profile", {
                first_name: req.userFound.first_name,
                surname: req.userFound.surname,
                email: req.userFound.email,
            });

        }

    } else {

        res.redirect("/not-logged-in");
    }
});

app.get("/not-logged-in", (req, res) => {
    res.render("not_logged_in")
});

app.get("/admin-profile", auth.isLoggedIn, (req, res) => {

    if (req.userFound){

        const admin = req.userFound.admin ? true : false

        if (admin) {

            res.render("admin_profile", {
                first_name: req.userFound.first_name,
                surname: req.userFound.surname,
                email: req.userFound.email,
                admin: admin
            });
            
        } else {

            res.redirect("/not-admin")

        }

    } else {

        res.redirect("/not-logged-in");
    }
});

app.get("/preupdate", auth.isLoggedIn, (req, res) => {

    if (req.userFound) {
        
        if (req.userFound.admin){
            res.render("preupdate", {
                admin: req.userFound.admin
            })
        } else {
            res.render("preupdate")
        }

    } else {
        res.redirect("/login")
    }
});

app.post("/preupdate", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        try {
            console.log(req.body.userEmail, req.body.userPassword)

            const user = await User.findOne({ email: req.body.userEmail});
            console.log(user)
            const isMatch = await bcrypt.compare(req.body.userPassword, user.password);

            if (isMatch) {

                res.redirect("/update")
            }

        } catch (error) {
            res.redirect("error")

        }
    } else {

        res.render("/not-logged-in")
    }


});

app.get("/update", auth.isLoggedIn, (req, res) => {

    if (req.userFound) {

        res.render("update", {
            first_name: req.userFound.first_name,
            surname: req.userFound.surname,
            email: req.userFound.email, 
            password: req.userFound.password,
            admin: req.userFound.admin

        })
    } else {

        res.redirect("/not-logged-in")
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

            res.render("admin_update", {
                first_name: userToUpdate.first_name,
                surname: userToUpdate.surname,
                email: userToUpdate.email, 
                password: userToUpdate.password,
                id: userToUpdate._id,
                admin: req.userFound.admin
    
            })

        } catch (error) {
            console.log(error)
            res.redirect("/error")

        }
    
    } else {

        res.redirect("/not-admin")
    }
});

app.post("/update/:id", auth.isLoggedIn, async (req, res) => {


    if (req.userFound && req.userFound.admin) { 

        const hashedPassword = await bcrypt.hash(req.body.password, 8);

        try {
           
          await User.findByIdAndUpdate(req.body.id, {
                first_name: req.body.first_name, 
                surname: req.body.surname, 
                email: req.body.email,
                password: hashedPassword
            });

            res.redirect("/allusers", {
                admin: req.userFound.admin
            })

        } catch (error) {
            console.log(error)
            res.redirect("error")
        }

    } else {
        res.redirect("/not-admin")
    }
});

app.post("/delete", auth.isLoggedIn, async (req, res) => {
   
    if (req.userFound) {

        try {
            const deletedBlogs = await Blog.deleteMany({user: req.userFound._id})
            const deleted = await User.findByIdAndDelete(req.userFound._id);
            console.log(deleted)
            res.render("deleted", {
                message: `${deleted.first_name} ${deleted.surname} has been deleted. Any blogs by ${deleted.first_name} ${deleted.surname} have also been deleted.`
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

app.get("/deleted", auth.logout, (req, res) => {
    res.render("deleted");
});

app.post("/delete/:id", auth.isLoggedIn, async (req, res) => {
   
    if (req.userFound && req.userFound.admin){

        try {

            const deletedBlogs = await Blog.deleteMany({user: req.params.id});
            const deleted = await User.findByIdAndDelete(req.params.id);
           
            res.render("deleted", {
                message: `${deleted.first_name} ${deleted.surname} has been deleted from the database.  Any blogs by ${deleted.first_name} ${deleted.surname} have also been deleted.`,
                admin: req.userFound.admin
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

                res.render("admin_allusers", {
                    users: users,
                    admin: req.userFound.admin
                })

            } catch (error) {
                console.log(error)
                res.redirect("/error")
            }

        } else {
            res.render("allusers")
        }

    } else {
        res.redirect("/not-logged-in")
    }
});

app.get("/newblog", auth.isLoggedIn, (req, res) => {

    if (req.userFound) {

        res.render("newblog", {
            admin: req.userFound.admin
        });

    } else {

        res.redirect("/not-logged-in");
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


// blog by admin here

app.get("/newblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin) {

        try {
            
            const user = await User.findOne({_id:req.params.id})
            // console.log(user)
            res.render("admin_newblog", {
                userId: user._id,
                first_name: user.first_name,
                surname: user.surname,
                admin: req.userFound.admin

            });

        } catch (error) {
            console.log("error")
            console.log(error)
            res.redirect("error")
        }   

    } else {

        res.redirect("/not-admin");
    }
});

app.post("/newblog/:id", auth.isLoggedIn, async (req, res) => {

    try {
        const newblog = await Blog.create({
            title: req.body.title,
            body: req.body.blog,
            user: req.params.id,
        });

        res.redirect("/allblogs")

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
            admin: req.userFound.admin
        });

    } else {

        res.redirect("/not-logged-in");
    }
});

app.get("/admin-userblogs/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin) {

        const blogs = await Blog.find({user:req.params.id}).populate('user', 'first_name surname');
        console.log('blogs')
        console.log(blogs)
        res.render("admin_userblogs", {
            blogs: blogs,
            first_name: blogs[0].user.first_name,
            surname: blogs[0].user.surname,
            admin: req.userFound.admin
        });

    } else {

        res.redirect("/not-admin");
    }
});

app.get("/allblogs", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        if (req.userFound.admin) {
        
            try {

                const allblogs = await Blog.find().populate('user', 'first_name surname')
                console.log(allblogs)
                res.render("userblogs", {
                    blogs: allblogs, 
                    admin: req.userFound.admin
                });

            } catch (error) {
                console.log(error)
                res.redirect("/error")
            }

        } else {

            try {

                const allblogs = await Blog.find().populate('user', 'first_name surname')

                res.render("allblogs", {
                    blogs: allblogs
                });

            } catch (error) {
                console.log(error)
                res.redirect("/error")
            }

        }

    } else {

        res.redirect("/not-logged-in")
        
    }
});

app.get("/updateblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound){

        const blogToUpdate = await Blog.findById(req.params.id)
        console.log(blogToUpdate)
        res.render("updateblog", {
            id: blogToUpdate._id,
            // title: blogToUpdate.title,
            title: "Two words here",
            blog: blogToUpdate.body, 
            admin: req.userFound.admin
        })

    } else {

        res.render("/not-logged-in")
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

app.get("/admin-updateblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin){

        try {

            const blogToUpdate = await Blog.findById({_id: req.params.id}).populate('user', 'first_name surname _id')

            res.render("admin-updateblog", {
                id: req.params.id,
                title: blogToUpdate.title,
                blog: blogToUpdate.body,
                first_name: blogToUpdate.user.first_name,
                surname: blogToUpdate.user.surname, 
                userId: blogToUpdate.user._id,
                admin: req.userFound.admin

            });

        } catch (error) {

            console.log(error)
            res.redirect("/error")

        }
       
    } else {

        res.render("/not-admin")
    }
});

app.post("/admin-updateblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound && req.userFound.admin) {

        try {
          
            const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, {
                title: req.body.title,
                body: req.body.blog
            })

            res.redirect(`/userblogs/${updatedBlog.user}`)

        } catch (error) {

            console.log(error);
            res.redirect("/error")

        }
        

    } else {
        res.redirect("/not-admin")
    }
})


app.post("/deleteblog/:id", auth.isLoggedIn, async (req, res) => {

    if (req.userFound) {

        try {

            deletedBlog = await Blog.findByIdAndDelete({_id:req.params.id})

            console.log(deletedBlog)

            res.render("deleted", {
                message: `blog ${deletedBlog.title} was deleted`,
                admin: req.userFound.admin
            })

        } catch (error) {
            console.log(error)
            res.redirect("error", {
                admin: req.userFound.admin
            });
        }

    } else {
        
        res.redirect("login")
    }

});

app.get("/blog/:id", auth.isLoggedIn, async (req, res) => {

    try {
     
        const blog = await Blog.findOne({_id: req.params.id}).populate('user first_name surname')
        console.log(blog)

        const blogDate = helpers.displayTime(blog.createdAt);
        
        if (req.userFound) {

            res.render("blog", {
                title: blog.title,
                blog: blog.body,
                firstName: blog.user.first_name,
                surname: blog.user.surname,
                date: blogDate,
                admin: req.userFound.admin
            });

        } else {

            res.redirect("/not-logged-in")
        }

    } catch (error) {
        console.log(error)
        res.redirect("/error");
    }

});

app.get('/not-admin', (req, res) => {
    res.render("not_admin");
});

app.get("/logout", auth.logout, (req, res) => {
    res.render("logout");
});

app.get("/error", auth.isLoggedIn, (req, res)=> {
    if (req.userFound){
        res.render("error", {
            admin: req.userFound.admin
        });
    } else {
        res.render("error")
    }
});

app.get('/*', auth.isLoggedIn, (req, res) => {

    if (req.userFound){
        res.render("404", {
            admin: req.userFound.admin
        });
    } else {
        res.render("404")
    }
    
});

app.listen(5000, () => {
    console.log('server running on port 5000');
});