const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

const User = require('./models/userModel');

exports.createCookie = (userId, response) => {

    const token = jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
        
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    }

    response.cookie('jwt', token, cookieOptions)
}

exports.displayTime = (time) => {
    const timeString = time.toString();
    const regex = /\w{3}\s\w{3}\s\d{2}\s\d{4}/
    const returned = timeString.match(regex)
    return returned;
}