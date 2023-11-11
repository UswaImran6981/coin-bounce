const express = require('express');
const dbConnect = require('./database/index');
const { PORT } = require('./config/index');
const router = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser')  //middleware

const app = express();

app.use(cookieParser());  // register cookie parser middleware  

app.use(express.json()) // use middleware -> allow application to communicate in json & accept & send data in json

app.use(router); // for use router

dbConnect(); // call database func 

app.use('/storage', express.static('storage')); // for blog image

app.get('/', (req, res) => res.json({ msg: 'hello' }));

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Backend is running on port ${PORT}`)
});