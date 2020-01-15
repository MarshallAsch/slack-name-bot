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
    admin_channel_id: {
        type: String,
    },
});

module.exports = schema;
