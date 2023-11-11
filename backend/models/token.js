const mongoose = require('mongoose');

const { Schema } = mongoose;

// make model & schema type object
const refreshTokenSchema = Schema({
    token: { type: String, required: true },
    userId: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' }
    // refer user name colection
},
    { timestamps: true }
);
module.exports = mongoose.model('RefreshToken', refreshTokenSchema, 'tokens');