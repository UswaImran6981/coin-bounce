const { ValidationError } = require('joi')

const errorHandler = (error, req, res, next) => {
    // default error
    let status = 500;
    let data = {
        message: 'Internal Server Error'
    }
    // error ka object ValiationError class type ka hai ya nahi?
    // error from Joi then handle this block
    if (error instanceof ValidationError) {
        status = 401;
        data.message = error.message;

        return res.status(status).json(data);
    }
    // if we get error aur usme status nam ki value ya attribute hai
    if (error.status) {
        status = error.status;
        // change the status -> overwrite the status
        // then store the value of error instead of status 500
    }
    if (error.message) {
        data.message = error.message;
    }
    return res.status(status).json(data);
}
module.exports = errorHandler;