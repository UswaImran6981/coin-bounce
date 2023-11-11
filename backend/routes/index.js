const express = require('express');
const authController = require('../controller/authController')
const blogController = require('../controller/blogController')
const commentController = require('../controller/commentController');
const auth = require('../middlewares/auth')

const router = express.Router(); //initialize router object

// define all end-points of TAB 

// testing
// router.get('/test', (req, res) => {
//     res.json({ msg: 'Working routes!!' })
// })

// user

// register
router.post('/register', authController.register);

// login (post--> bcz send data from user)
router.post('/login', authController.login);

// logout
router.post('/logout', auth, authController.logout);
// router.post('endpoint', middleware(authentication), controller)

// refres (JWT tokens)
router.get('/refresh', authController.refresh);
// for good user experience "when our token expire instead of user login manually we automaically refresh the user token

// blog
//CRUD
// create (method)
router.post('/blog', blogController.create);

// read all blogs (getAll method)
router.get('/blog/all', blogController.getAll);

// read blog by ID
router.get('/blog/:id', blogController.getById);

// update
router.put('/blog', blogController.update);

// delete
router.delete('/blog/:id', blogController.delete);

// comment
// create comment
router.post('/comment', commentController.create);

// get
// read comments by blog id
router.get('/comment/:id', commentController.getById);


// A JSON Web Token, popularly known as JWT,
// is an open standard that defines a compact way for securely sharing information between two parties: a client and a server
// & are most commonly used to identify an authenticated user.

module.exports = router;
