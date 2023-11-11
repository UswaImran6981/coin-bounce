const mongoose = require('mongoose');

const { Schema } = mongoose;

const commentSchema = new Schema({
    content: { type: String, required: true },
    blog: { type: mongoose.SchemaTypes.ObjectId, ref: 'Blog' }, // refer blogs tpye connection/document
    author: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' } // refer users typr document
},
    { timestamps: true }
);
module.exports = mongoose.model('Comment', commentSchema, 'comments');