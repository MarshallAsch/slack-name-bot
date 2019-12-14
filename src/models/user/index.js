/**
 * This module defines a User class. This user is for the slack user to keep track
 * of any changes in the users information.
 *
 * @author Marshall Asch <masch@uoguelph.ca>
 * @module models/user
 */
"use strict";

const users = require("./users.js");

// export classes
module.exports = {
    User: users.User,
};
