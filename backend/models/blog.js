const mongoose = require('mongoose');

//Destructure schema from mongoose
//const Schema = mongoose.Schema;  //other way
const { Schema } = mongoose;

// make a object to define blog model -- schema type 
const blogSchema = new Schema({
    // id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    photoPath: { type: String, required: true },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' }//reference type --refer the user collection which is user type
},
    // mongoDB assign a ID to every record , when we store data
    // store each record creation timestamps & also store timestamps that how many times record update
    { timestamps: true }
);
// module.exports = mongoose.model('model name[model import by this name where we need in backend]', model Schema, 'connection name save in db')
module.exports = mongoose.model('Blog', blogSchema, 'blogs')