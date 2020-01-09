/**
 * User model. This module exports a Settings class.
 *
 * @module models/user
 */
"use strict";

const mongoose = require("mongoose");
const schema = require("./schema.js");

const SettingModel = mongoose.model("Settings", schema);


/**
 *  User is a class that represents a user of the eNuk application.
 *  @property {string} id      - the user ID
 *  @property {string} name    - the user's name
 *  @property {string} email   - the user email
 *  @property {number} session - the user's current session number
 *  @property {Role}   role    - unprivileged user Role
 */
class Settings {

    constructor(teamId, channel) {
        this._model = new SettingModel({
            team_id: teamId,
            admin_channel_id: channel,
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

    get adminChannel() {
        return this._model.admin_channel_id;
    }

    static isAdminChannel(teamId, channelId) {

        return SettingModel.findOne({team_id: teamId, admin_channel_id: channelId})
        .then((result) => {
            return result != null;
        });
    }

    // remove the channel from the list
    static removeChannel(teamId, channelId) {

        return SettingModel.findOneAndDelete({team_id: teamId, admin_channel_id: channelId})
        .then((result) => {
            return result;
        });
    }

    static findAllAdminChannels(teamId) {

        return SettingModel.find({team_id: teamId})
        .then((result) => {
            let channels = [];

            results.forEach((result) => {
                let s = new Settings();
                s._model = result;
                channels.push(s);
            });

            return channels;
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
    Settings: Settings,
};
