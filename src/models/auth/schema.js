/**
 * Defines a mongoose schema for Auth objects.
 *
 * @see module:models/auth
 */
"use strict";

const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    team_id: {
        type: String,
    },
    token: {
        type: String,
    },
    team_name: {
        type: String,
    },
    enterprise_id: {
        type: String,
    },
    bot_id: {
        type: String,
    },
    bot_token: {
        type: String,
    },
    domain: {
        type: String,
    },
});

module.exports = schema;
