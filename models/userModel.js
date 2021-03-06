const mongoose = require('mongoose');

const user = new mongoose.Schema({
    first_name: {
        type: String, 
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true
    },
    password: {
        type: String, 
        required: true
    },
    admin: {
        type: Boolean, 
        default: false
    }
});

module.exports = mongoose.model('user', user)