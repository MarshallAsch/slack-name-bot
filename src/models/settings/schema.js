/**
 * Defines a mongoose schema for Settings objects.
 *
 * @see module:models/settings
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
    }
});

module.exports = schema;
