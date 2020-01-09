/**
 * User model. This module exports a Auth class.
 *
 * @module models/user
 */
"use strict";

const mongoose = require("mongoose");
const schema = require("./schema.js");

const AuthModel = mongoose.model("Auth", schema);


/**
 *  User is a class that represents a user of the eNuk application.
 *  @property {string} id      - the user ID
 *  @property {string} name    - the user's name
 *  @property {string} email   - the user email
 *  @property {number} session - the user's current session number
 *  @property {Role}   role    - unprivileged user Role
 */
class Auth {

    constructor(teamId, enterpriseId, token, teamName, botId, botToken) {
        this._model = new AuthModel({
            team_id: teamId,
            enterprise_id: enterpriseId,
            token: token,
            team_name: teamName,
            bot_id: botId,
            bot_token: botToken
        });
    }

    get id() {
        return this._model._id.toString();
    }

    get _mongoId() {
        return this._model._id;
    }

    get teamId() {
        return this._model.team_id;
    }

    get token() {
        return this._model.token;
    }

    // This will return a Date Object
    get enterpriseId() {
        return this._model.enterprise_id;
    }

    get teamName() {
        return this._model.team_name;
    }

    get botToken() {
        return this._model.bot_token;
    }

    get botId() {
        return this._model.bot_id;
    }

    static getTokenForTeam(teamId) {

        return AuthModel.findOne({team_id: teamId})
        .then((result) => {
            return result.token;
        });
    }

    static getBotTokenForTeam(teamId) {

        return AuthModel.findOne({team_id: teamId})
        .then((result) => {
            return result.bot_token;
        });
    }

    static getTokensForTeam(teamId) {

        return AuthModel.findOne({team_id: teamId})
        .then((result) => {
            return {
                token: result.token,
                bot_token: result.bot_token
            };
        });
    }

    /**
     * Saves the user to the database. Save fails if the user is already in the
     * database.
     * @method
     * @return {Promise} resolves with the saved user;
     *                   rejects with Error
     */
    save() {
        return this._model.save().then(() => {
            return this;
        });
    }
}

module.exports = {
    Auth: Auth,
};
