// Authentication middleware --------- Validation by cental location
// to check the req of user.. is it authenticate.. have valid access & refresh token or not
// use this middleware in protected API endpoint

const JWTService = require('../services/JWTService');
const User = require('../models/user');
const UserDTO = require('../dto (Data transfer object)/user');

// create auth method
const auth = async (req, res, next) => {
    try {
        // --> 1. refresh, access token validation
        // access from cookies
        const { refreshToken, accessToken } = req.cookies;

        if (!refreshToken || !accessToken) {
            const error = {
                status: 401,
                message: 'Unauthorized'
            }
            return next(error)
        }
        // for error handdling use try/catch
        let id;
        try {
            // verify the acess token by using this service -> we need token
            // destructure id from this
            // const { id } = JWTService.verifyAccessToken(accessToken);
            // this should be JWTService.verifyAccessToken[accessToken].id;
            id = JWTService.verifyAccessToken(accessToken);
        }
        catch (error) {
            return next(error);
        }

        // get user details by using this id in the db
        let user;
        try {
            user = await User.findOne({ id: id });
            // id which we get after verification and which is in payload
        }
        catch (error) {
            return next(error);
        }
        const userDto = new UserDTO(user);

        req.user = userDto;

        // call next middleware
        next();
    }
    catch (error) {
        return next(error);
    }

}
module.exports = auth;

// middleware is a func which is run after complelition of response and request