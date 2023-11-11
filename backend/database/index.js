//database code in it , established conection to the database
const mongoose = require('mongoose'); // import
// destructure the MONGODB_CONNECTION_STRING  (bcz export var in the form of object)
const {MONGODB_CONNECTION_STRING} = require('../config/index')
//store connection sting in the form of string
// const connectionString = "mongodb+srv://UswaImran:Uswa-129@cluster0.zwbnld3.mongodb.net/coin-bounce?retryWrites=true&w=majority";

const dbConnect = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);
        console.log(`Database conected to the host: ${conn.connection.host}`);
    }
    catch (error) {
        console.log(`Error: ${error}`);
    }
}
module.exports = dbConnect;
// import in server.js