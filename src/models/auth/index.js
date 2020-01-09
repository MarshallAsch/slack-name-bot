/**
 * This module defines a Auth class. This is used to keep track of access tokens
 * for different workspaces that the app is added to.
 * @author Marshall Asch <masch@uoguelph.ca>
 * @module models/user
 */
"use strict";

const auth = require("./auth.js");

// export classes
module.exports = {
    Auth: auth.Auth,
};
