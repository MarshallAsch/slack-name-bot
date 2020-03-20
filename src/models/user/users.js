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

    // This will return a Date Object
    get updated() {
        return new Date(this._model.updated * 1000);
    }

    get event() {
        return this._model.event;
    }

    setEmail(email) {
        this._model.email = email;
        return this;
    }

    setRealName(name) {
        this._model.real_name = name;
        return this;
    }

    setDisplayName(name) {
        this._model.display_name = name;
        return this;
    }

    setUserId(id) {
        this._model.user_id = id;
        return this;
    }

    setTeamId(id) {
        this._model.team_id = id;
        return this;
    }

    setDeleted(del) {
        this._model.deleted = del;
        return this;
    }

    // This expects a unix time stamp integer
    setUpdated(time) {
        this._model.updated = time;
        return this;
    }

    setEvent(event) {
        this._model.event = event;
        return this;
    }


    static getUserHistory(teamId, userId) {

        return UserModel.find({team_id: teamId, user_id: userId, }).sort({update: "asc", })
        .then((results) => {
            let history = [];

            let last = null;

            results.forEach((result) => {
                let u = new User();
                u._model = result;


                if (User.checkDuplicate(last, u) == false) {
                    history.push(u);
                }

                last = u;
            });

            return history;
        });
    }

    // return true if they are duplicates
    static checkDuplicate(previous, current) {

        if (!previous) {
            return false;
        }

        if (previous.email === current.email
                && previous.realName === current.realName
                && previous.displayName === current.displayName) {
            return true
        }
        return false;
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
