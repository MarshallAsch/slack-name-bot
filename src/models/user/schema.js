/**
 * Defines a mongoose schema for User objects.
 *
 * @see module:models/user
 */
"use strict";

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    // account email
    email: {
        type: String,
    },
    // the users real name
    real_name: {
        type: String,
    },
    // the users display name, will replace the older name field
    display_name: {
        type: String,
    },
    // the user id that is unique to the workspace
    user_id: {
        type: String,
    },
    // the workspace id that the user is part of
    team_id: {
        type: String,
    },
    // has the user account been disabled
    deleted: {
        type: Boolean,
        default: false,
    },
    updated: {
        type: Number,
    },
    event: {
        type: String,
    },
});

module.exports = schema;
