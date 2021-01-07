const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.isLoggedIn = async (req, res, next) => {
    console.log("Checking if user is logged in.");

    if (req.cookies.jwt) {
        console.log('token decoded');

        const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

        req.userFound = await User.findById(decoded.id)
    }

    next();
}

exports.logout = (req, res, next) => {

    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    })

    next();
}


