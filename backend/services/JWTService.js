// through this service we store, sign, verify JWT Tokens in central location 
// where all the work is done according to JWT token and authentication

const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = require('../config/index');
const RefreshToken = require('../models/token')

class JWTService {
    // some methods 
    // make the methods static, bcz when we import or use then we don't have need to create new object everytime 
    // after that we dirctly put the class name and access the method
    // sign access token  
    // payload -> imbed data in token key
    static signAccessToken(payload, expiryTime) {
        // return jwt.sign(payload, ACCESS_TOKEN_SECRET, {});
        return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: expiryTime });
    }
    // sign refresh token 
    static signRefreshToken(payload, expiryTime) {
        // return jwt.sign(payload, REFRESH_TOKEN_SECRET, {});
        return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: expiryTime });
    }
    // verify accesss token 
    static verifyAccessToken(token) {
        return jwt.verify(token, ACCESS_TOKEN_SECRET); // return payload
    }
    // verify refresh token 
    static verifyRefreshToken(token) {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    }
    // store refresh token 
    static async storeRefreshToken(token, userId) {
        //Use Try/Catch -> to communicate with db
        try {
            // create new document
            const newToken = new RefreshToken({
                token: token,
                userId: userId
            });
            // store in db
            await newToken.save();
        }
        catch (error) {
            console.log(error);
        }
    }
}

module.exports = JWTService;

// Commands ----> for generate secret key [random token]
// node
// const crypto = require('crypto')
// crypto.randomBytes(64).toString('hex')
// 2eca74d420ec2d352bc8d4f8980e939df62f94cca96d2c9e8e70a8ca1002786ffb2c5856836e57b226618fdb21e0a635bb30aa3724d1b1c1fc6319df0abc1fbe