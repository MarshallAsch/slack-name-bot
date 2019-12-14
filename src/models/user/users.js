/**
 * User model. This module exports a User class.
 *
 * @module models/user
 */
"use strict";

const mongoose = require("mongoose");
const schema = require("./schema.js");

const UserModel = mongoose.model("User", schema);


/**
 *  User is a class that represents a user of the eNuk application.
 *  @property {string} id      - the user ID
 *  @property {string} name    - the user's name
 *  @property {string} email   - the user email
 *  @property {number} session - the user's current session number
 *  @property {Role}   role    - unprivileged user Role
 */
class User {

    constructor() {
        this._model = new UserModel({});
    }


    get id() {
        return this._model._id.toString();
    }

    get _mongoId() {
        return this._model._id;
    }

    get email() {
        return this._model.email;
    }

    get realName() {
        return this._model.real_name;
    }

    get displayName() {
        return this._model.display_name;
    }

    get userId() {
        return this._model.user_id;
    }

    get teamId() {
        return this._model.team_id;
    }

    get deleted() {
        return this._model.deleted;
    }

    get updated() {
        return this._model.update;
    }

    get event() {
        return this._model.event;
    }

    setEmail(email) {
        this._model.email = email;
    }

    setRealName(name) {
        this._model.real_name = name;
    }

    setDisplayName(name) {
        this._model.display_name = name;
    }

    setUserId(id) {
        this._model.user_id = id;
    }

    setTeamId(id) {
        this._model.team_id = id;
    }

    setDeleted(del) {
        this._model.deleted = del;
    }

    setUpdated(time) {
        this._model.update = time;
    }

    setEvent(event) {
        this._model.event = event;
    }



    static getUserHistory(teamId, userId) {

        return UserModel.find({team_id: teamId, user_id: userId}).sort({update: "asc"})
        .then((results) => {
            let history = [];

            results.forEach((result) => {
                let u = new User();
                u._model = result;
                history.push(u);
            });

            return history;
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
    User: User,
};
