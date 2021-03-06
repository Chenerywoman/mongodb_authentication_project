const mongoose = require('mongoose');

const blog = new mongoose.Schema({
    title: {
        type: String, 
        required: true
    },
    body: {
        type: String, 
        required: true
    }, 
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true, 
        ref: 'user'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('blog', blog)