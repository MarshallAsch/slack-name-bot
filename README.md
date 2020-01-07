# Tracking Slack Name and Email Changes


This Slack app is based off of the [template-terms-of-service](https://github.com/slackapi/template-terms-of-service) sample app.

This Slack app will receive an event every time a user signs up for the workspace or changes their details.
Any workspace administrator is able to query the history using the slash command `/whois [@user]`.


## Setup

#### Create a Slack app

1. [Create an app](https://api.slack.com/apps)
2. Go to **Bot Users** and click "Add a Bot User" to create a, app bot. Save the change.
3. Enable Interactive components (See *Enable Interactive Components* below)
4. Navigate to the **OAuth & Permissions** page and add the following scopes:
    * `chat:write:bot`
    * `commands`
    * `users:read`
    * `users:read:email`
5. Click 'Save Changes' and install the app (You should get an OAuth access token after the installation)
6. Enable the events (See *Enable the Events API* below. It doesn't let you  the Request URL until you run the code!)
7. In your Slack workspace, invite the bot to #general, where the new user will join.

#### Run locally
1. Get the code
    * Either clone this repo and run `npm install`
    * Or run it as a docker container `docker pull marshallasch/slack-name-bot`
2. Set the following environment variables to `.env` (see `.env.sample`):
    * Note this will be created by `docker run marshallasch/slack-name-bot` as long as the variables are set
    * `SLACK_ACCESS_TOKEN`: Your app's `xoxb-` token (available on the Install App page, after you install the app to a workspace once.)
    * `SLACK_SIGNING_SECRET`: Your app's Signing Secret (available on the **Basic Information** page)
    * `DATABASE` the data base name to use
    * `DB_PORT` the mongo db port to connect to (default is 27017)
    * `DB_HOST` the host of the mongo db server
    * `DB_USER` the mongo db user name
    * `DB_PASS` the plain text mogodb password
    * `ADMIN_CHANNEL_ID` the admin channel ID (NOT channel name) to display the messages publicly in
    * `IMPORT_USERS` if set to 1 then it will import all users from the slack workspace
3. If you're running the app locally:
    * Start the app (`npm start`)

#### Enable the Events API
1. Go back to the app settings and click on Events Subscriptions
1. Set the Request URL to your server (*e.g.* `https://yourname.ngrok.com`) + `/events`
1. On the same page, subscribe to the `team_join` and `user_change` workspace events

#### Enable the Slash Commands
1. Go back to the app settings and click on Slash Commands
1. Set the Request URL to your server (*e.g.* `https://yourname.ngrok.com`) + `/command`
1. On the same page, set the command name to `/whois` and the description
1. On the same page, check the `Escape channels, users, and links sent to your app` checkbox


#### Enable Interactive Messages
1. In the app settings, click on Interactive Messages
1. Set the Request URL to your server or Glitch URL + `/interactive`



### Requirements

This application requires a connection to mongodb

To create the mongodb database and user account run

```
use slack_users
db.createUser(
   {
     user: "slackBot",
     pwd: "slackpass",
     roles: [ "readWrite" ]
   }
)
```

From a mongo shell on the db server.
