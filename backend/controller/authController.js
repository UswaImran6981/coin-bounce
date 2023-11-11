// basic logic of routes when we receive the req
// then controller execute the logic
// npm i joi
// npm i bcryptjs  -> for password hash
const Joi = require('joi');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const JWTService = require('../services/JWTService');
const UserDTO = require('../dto (Data transfer object)/user');
const RefreshToken = require('../models/token');

const passwordPattren = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;

const authController = {
    // ----------REGISTER ROUTE CONTROLLER----------------
    async register(req, res, next) {
        // --> 1. validate user input (make schema)
        const userRegisterSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            name: Joi.string().max(30).required(),
            email: Joi.string().email().required(),
            password: Joi.string().pattern(passwordPattren).required(),
            confirmPassword: Joi.ref('password')
        });
        // destructure error from body
        const { error } = userRegisterSchema.validate(req.body);

        // --> 2. if error in validation => return error via middleware (with the help of middlewre errorHandling )
        if (error) {
            return next(error);
        }

        // --> 3. if email or username is already registered -> return an error
        // { username, name, email, password} destructure from body
        const { username, name, email, password } = req.body

        // to communicate with database then use " try catch " that make the errorHandling simple  
        try {
            // check the email & username ..it already exist or not
            // User -> use mongoose model (use func to check there must be no email which is already use in User connection) 
            const emailInUse = await User.exists({ email });
            const usernameInUse = await User.exists({ username });

            if (emailInUse) {
                // make error object
                const error = {
                    status: 409,   //conflict
                    message: 'Email already registered, use another email!'
                }
                // call middleware
                return next(error);
            }

            if (usernameInUse) {
                const error = {
                    status: 409,
                    message: 'Username not available, choose another username!'
                }
                return next(error);
            }
        }

        //get other error like we can't connect with database
        catch (error) {
            return next(error);
        }

        // --> 4. password hash (user password convert to hash and store in database)
        const hashedPassword = await bcrypt.hash(password, 10);
        // 10 means solting round which is handle by bcrpyt for additional security --add random string or no.
        //npm i bcryptjs
        // 123abc -> hjfwu489093uifjw90%#@
        // user login again => enter password (123abc) -> then mach the hash with orignal hash and then access the user 
        // (1233abcc) if user enter wrong password then hash of this wrong pasword doesn't match with orignal hash then it is invalid

        // --> 5. store user data in db
        // integrate tokens in registered controller

        let accessToken;
        let refreshToken;
        let user;
        try {
            const userToRegister = new User({
                // username: username, email:email -> if key or value are same
                username,
                email,
                name,
                password: hashedPassword
            });
            user = await userToRegister.save();

            // token genetation
            // var= method of JWT Service ({payload -> send username & id then decode })
            // payload must consistance
            accessToken = JWTService.signAccessToken({ id: user.id }, '30m');

            refreshToken = JWTService.signRefreshToken({ id: user.id }, '60m');
            // now send these tokens on client side and this work is done in cookies
        }
        catch (error) {
            return next(error);
        }
        // --> Store refresh token in db
        await JWTService.storeRefreshToken(refreshToken, user.id)

        // send Access & Refresh tokens in cookies
        res.cookie('accessToken', accessToken, {
            // cofigrations / options
            // expiry time of both JWT Token and Cookies are DIFFERENT
            maxAge: 1000 * 60 * 60 * 24,  // means cookie expiry time in mili second, 1000 means 1s
            httpOnly: true // for security client side browser or js can't access this
            // we access only when client send refresh token on backend from client side
        });
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        });
        // --> 6. response send
        // make object // get filter info which define in dto // to secure and easy
        // auth ->  Handle protected routes
        const userDto = new UserDTO(user);
        return res.status(201).json({ user: userDto, auth: true });
    },

    // ----------LOGIN ROUTE CONTROLLER----------------
    async login(req, res, next) {
        // --> 1. validation user input
        // we expect input data to be in such shape
        const userLoginSchema = Joi.object({
            username: Joi.string().min(5).max(30).required(),
            password: Joi.string().pattern(passwordPattren).required()
        });
        const { error } = userLoginSchema.validate(req.body);

        // --> 2. if validation error, return error using middleware
        if (error) {
            return next(error);
        }

        // --> 3. match username and password (to communicate with db)
        const { username, password } = req.body
        // const username =req.body.username
        // const password =req.body.password
        let user;
        try {

            // match username
            user = await User.findOne({ username: username });
            if (!user) {
                const error = {
                    status: 401, // for unauthorize or invalid condentials
                    message: 'Invalid username or password'
                }
                return next(error);
            }

            // match password
            // req.body.password -> hash -> match
            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                const error = {
                    status: 401, // for unauthorize or invalid condentials
                    message: 'Invalid password'
                }
                return next(error);
            }
        }
        catch (error) {
            return next(error);
        }

        //   const accessToken= JWTService.signAccessToken({payload -> payload must be less for best practice  }, expiry time)
        // identify the user by id & get info through single query (detail in frontend)
        const accessToken = JWTService.signAccessToken({ id: user.id }, '30m')
        const refreshToken = JWTService.signRefreshToken({ id: user.id }, '60m')

        // Update Refresh Token in database 
        try {
            // if it get matching then update it otherwise insert new record   
            await RefreshToken.updateOne({
                id: user.id
            },
                { token: refreshToken }, // update token
                { upset: true }
            )
        }
        catch (error) {
            return next(error);
        }

        // send in cookies
        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        });

        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24,
            httpOnly: true
        });

        // --> 4. return response
        // make object // get filter info which define in dto
        // auth ->  Handle protected routes
        const userDto = new UserDTO(user);
        return res.status(200).json({ user: userDto, auth: true });
    },

    // ----------LOGOUT CONTROLLER----------------
    async logout(req, res, next) {
        // console.log("ali");
        console.log(req);
        // --> 1. delete refresh token from db (refresh token comes from cookies , now destruct)
        const { refreshToken } = req.cookies;
        try {
            await RefreshToken.deleteOne({ token: refreshToken });
            // res.json({msg:'Working!!'})
            // delete: where token value(token feild which define in token schema) match with refreshToken
        }
        catch (error) {
            return next(error);
        }
        // Check if a user object exists before accessing its 'id' property
        if (req.user && req.user.id) {
            // Access the 'id' property of the user
            const userId = req.user.id;
            // Perform any necessary actions with userId
        }
        // --> 2. delete cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        // --> 3. send response
        res.status(200).json({ user: null, auth: false });
    },

    // ----------REFRESH CONTROLLER----------------
    async refresh(req, res, next) {
        // 1- get refreshToken from cookies
        // 2- verify refreshToken
        // 3- generate new tokens
        // 4- update db, return response  

        // const {refreshToken}= req.cookies; butt this is used to generate token
        const originalRefreshToken = req.cookies.refreshToken;
        let id;
        try {
            id = JWTService.verifyRefreshToken(originalRefreshToken).id;
        }
        catch (e) {
            const error = {
                status: 401,
                message: 'Unathorized'
            }
            return next(error);
        }
        // verify token
        try {
            const match = RefreshToken.findOne({ id: id, token: originalRefreshToken });
            if (!match) {
                const error = {
                    status: 401,
                    message: 'Unauthorized'
                }
                return next(error);
            }
        }
        catch (e) {
            return next(e);
        }
        // generate token 
        try {
            const accessToken = JWTService.signAccessToken({ id: id }, '30m')
            const refreshToken = JWTService.signRefreshToken({ id: id }, '60m')
            // send cookies
            await RefreshToken.updateOne({ id: id }, { token: refreshToken })
            // send in cookies
            res.cookie('accessToken', accessToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });

            res.cookie('refreshToken', refreshToken, {
                maxAge: 1000 * 60 * 60 * 24,
                httpOnly: true
            });
        }
        catch (e) {
            return next(e);
        }
        const user = await User.findOne({ id: id });
        const userDto = new UserDTO(user);
        return res.status(200).json({ user: userDto, auth: true });
    }


}
module.exports = authController;