class UserDTO {
    // pass user type object in constructor
    constructor(user) {
        this.id = user.id;
        this.username = user.username;
        this.email = user.email;
    }
}

module.exports = UserDTO;