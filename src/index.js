require('dotenv').config({ path: process.cwd() + '/config/.env' });
//const axios = require('axios');

const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const signature = require('./verifySignature');
const users = require('./models/user');
const auth = require('./models/auth');
const settings = require('./models/auth');

const app = express();

const { WebClient } = require('@slack/web-api');

/*
 * Parse application/x-www-form-urlencoded && application/json
 * Use body-parser's `verify` callback to export a parsed raw body
 * that you need to use to verify the signature
 */

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.get('/', (req, res) => {
  res.send('<h2>This application was developed for gryph.slack.com to keep track' +
  'of identiy changes to prevent anonimity related issues</p>');
});

/*
 * Endpoint to receive events from Slack's Events API.
 * It handles `team_join` and `user_change` event callbacks.
 */
app.post('/events', (req, res) => {
  switch (req.body.type) {
    case 'url_verification': {
      // verify Events API endpoint by returning challenge if present
      res.send({ challenge: req.body.challenge });
      break;
    }
    case 'event_callback': {
      // Verify the signing secret
      if (signature.isVerified(req)) {
        res.sendStatus(200);

        const event = req.body.event;
        console.log(event);

        // `team_join` is fired whenever a new user (incl. a bot) joins the team
        if ((event.type === 'team_join' || event.type === 'user_change')  && !event.is_bot) {
          // this will record the user
          logUser(event.user, event.type)
          .then((user) => {
              console.log("Logged user: " +  user);
          })
          .catch((err) => {
              console.log("Failed to log the users information.");
          })
        }
    } else { res.sendStatus(200); }
      break;
    }
    default: { res.sendStatus(200); }
  }
});

app.post('/command', (req, res) => {
  // extract the slash command text, and trigger ID from payload
  const { text, team_id, trigger_id, command, channel_id, user_id, response_url } = req.body;

  const userIdRegex = RegExp('<@([A-Z0-9]*)\\|.+>');

  // Verify the signing secret
  if (signature.isVerified(req)) {
    // create the dialog payload - includes the dialog structure, Slack API token,
    // and trigger ID

    console.log(req.body);

    // first check that it is the correct command
    if (command != "/whois") {
        console.log('Not the correct command');
        return res.sendStatus(200);
    }

    let slackApi = null;
    let slackBotApi = null;
    auth.Auth.getTokensForTeam(team_id)
    .then((tokens) => {

        slackApi = new WebClient(tokens.token);
        slackBotApi = new WebClient(tokens.bot_token);
        return slackApi.users.info({user: user_id});
    })
    .then((result) => {

        if (!result.user.is_admin) {
            res.json({
                "response_type": "ephemeral",
                "text": "Sorry, you are not authorized for that. "
            });
            return null;
        }

        if (text == 'import') {
            return importUsers(slackApi);
        } else if (text == 'add') {
            return addAdminChannel(req, res, slackApi);
        } else if (text == 'list') {
            return listAdminChannel(req, res, slackBotApi);
        } else if (text == 'remove') {
            return removeAdminChannel(req, res, slackApi);
        } else if (userIdRegex.test(text)) {
            lookupId = userIdRegex.exec(text);

            return lookupHistory(req, res, lookupId, slackApi);
        } else {
            // print help message
            return help(req, res, text);
        }
    })
    .catch((err) => {
        console.log('call to get user info failed');
        console.log(err);
        res.sendStatus(200);
    });
  } else {
    console.log('Verification token mismatch');
    res.sendStatus(200);
  }
});


function importAllUsers(req, res, slackApi) {

    importUsers(slackApi)
    .then((result) => {

        // message has already been sent
        return res.json({
            "response_type": "ephemeral",
            "text": `${result.numUsers} Have been imported.`
        });
    })
    .catch((err) => {
        console.log('import users failed');
        console.log(err);
        res.sendStatus(200);
    });
}

function lookupHistory(req, res, lookupId, slackApi) {


    let teamId = req.body.team_id;

    if (lookupId == null) {

        // then the text is not a user id
        res.json({
            "response_type": "ephemeral",
            "text": "text is not a userId"
        });

        return null;
    }

    users.User.getUserHistory(teamId, lookupId)
    .then((history) => {
        let payload = {};

        if (history.length != 0) {

            payload = {
            	"blocks": [
            		{
            			"type": "section",
            			"text": {
            				"type": "mrkdwn",
            				"text": `History for:\n*<@${history[0].userId}>* (${history[0].userId})`
            			}
            		},
                ]
            };

            history.forEach((h) => {

               let timeString = "<!date^" + Math.floor( h.updated.getTime() / 1000) + "^{date_num} {time_secs}|" + h.updated.toUTCString() + ">";
               let item = {
                   "type": "section",
                   "fields": [
                       {
                           "type": "mrkdwn",
                           "text": `*Display Name:*\n${h.displayName}`
                       },
                       {
                           "type": "mrkdwn",
                           "text": `*Real Name:*\n${h.realName}`
                       },
                       {
                           "type": "mrkdwn",
                           "text": `*Email:*\n${h.email}`
                       },
                       {
                           "type": "mrkdwn",
                           "text": `*Last Update:*\n${timeString}`
                       }
                   ]
               };

               payload.blocks.push(item, { "type": "divider" });
           });

        } else {
            payload = {
                text: "No Details for that user.",
            };
        }

        if (channel_id == process.env.ADMIN_CHANNEL_ID) {
            payload.response_type = "in_channel";
        } else {
            payload.response_type = "ephemeral";
        }

        res.json(payload);
    })
    .catch((err) => {
        console.log('call to get user info failed');
        console.log(err);
        res.sendStatus(200);
    });
}

// Must invlite @namebot to the channel first
// this must be run fromthe channel that you wish to add to the list
function addAdminChannel(req, res, slackApi) {

    let teamId = req.body.team_id;
    let channelId = req.body.channel_id;

    let channel = new settings.Settings(teamId, channelId);

    channel.save()
    .then((channel) => {

        res.json({
            text: "Channel added to the list.",
            response_type: "ephemeral",
        });
    })
    .catch((err) => {
        console.log('call to get add channel failed');
        console.log(err);
        res.sendStatus(200);
    });
}

function removeAdminChannel(req, res, slackApi) {

    let teamId = req.body.team_id;
    let channelId = req.body.channel_id;

    settings.Settings.removeChannel(teamId, channelId)
    .then((channel) => {

        res.json({
            text: "Channel removed from the list.",
            response_type: "ephemeral",
        });
    })
    .catch((err) => {
        console.log('call to get remove channel failed');
        console.log(err);
        res.sendStatus(200);
    });
}

function listAdminChannel(req, res, slackApi) {

    let teamId = req.body.team_id;

    settings.Settings.findAllAdminChannels(teamId)
    .then((channels) => {

        let promises = [];

        channels.forEach((c) => {
            promises.push(slackApi.conversations.info({channel: c}));
        });

        return Promise.all(promises);
    })
    .then((results) => {

        let list = ""
        results.forEach((r) => {
            list += " *  " + r.name + "\n";
        });

        res.json({
            text: "Channels where the response is public: \n\n" + list,
            response_type: "ephemeral",
        });
    })
    .catch((err) => {
        console.log('call to get remove channel failed');
        console.log(err);
        res.sendStatus(200);
    });
}

function help(req, res, helpWith) {

    const supportMessage =
    "To use the application send `/whois [help, import, @user, add #channel, remove #channel]`\n" +
    "`/whois @user` - will get the history of user name and email changes\n" +
    "`/whois add` - will add the current channel to the list where the response can be visible to all users in a channel (Must add the `@namebot` to the channel)\n" +
    "`/whois remove` - will remove the current channel to the list where the response can be visible to all users in a channel \n" +
    "`/whois list` - list all the channel names where the response is posted publicly\n" +
    "`/whois import` - will import all the current users names and emails into the database. (run this the first time the app is run)\n" +
    "By default the message is only shown to the user who sent the command. The only users who can use this app are workspace admins.\n";

    res.json({
        "response_type": "ephemeral",
        "text": supportMessage
    });

}

// tresulthis will exchange the code for an oauth token so the app can be installed in multiple work spaces
app.get('/oauth', (req, res) => {

    if (req.query.error == 'access_denied') {
        return res.sendStatus(401);
    }

    const payload = {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.query.code
    };

    (new WebClient()).oauth.access(payload)
    .then((result) => {

        if (!result.ok) {
            res.sendStatus(200);
            return null;
        }

        const token = result.access_token;
        const enterpriseId = result.enterprise_id;
        const teamId = result.team_id;
        const teamName = result.team_name;
        const botId = result.bot.bot_user_id;
        const botToken = result.bot.bot_access_token;

        console.log("Work space was successfully authorized to use the application.");

        // store the tokens somewhere
        const authRecord = new auth.Auth(teamId, enterpriseId, token, teamName, botId, botToken);

        return authRecord.save();
    })
    .then((auth) => {

        if (auth == null) {
            return null;
        }

        const slackApi = new WebClient(auth.token);
        return slackApi.team.info({team: auth.teamId});
    })
    .then((result) => {

        if (result == null) {
            return null;
        }

        // redirect to the slack space
        res.redirect('http://' + result.team.domain + '.slack.com');
    })
    .catch((err) => {
        console.log('call to get oauth failed');
        console.log(err);
        res.sendStatus(500);
    });
});


function logUser(user, event) {

    const userRecord = new users.User()
    .setEvent(event)
    .setTeamId(user.team_id)
    .setUserId(user.id)
    .setUpdated(user.updated)
    .setEmail(user.profile.email || "")
    .setRealName(user.profile.real_name)
    .setDisplayName(user.profile.display_name)
    .setDeleted(user.deleted);

    return userRecord.save();
}

// Used to run the import of all users in the workspace
// FIXME:  this function is bad, not sure if it compleetes before it returns
async function importUsers(slackApi)  {


    let numUsers = 0;
    for await (const page of slackApi.paginate('users.list', )) {

        numUsers += page.members.length;
        page.members.forEach((m) => {
            if (!m.is_bot && m.id != 'USLACKBOT') {
            logUser({
                id: m.id,
                team_id: m.team_id,
                name: m.name,
                deleted: m.deleted,
                updated: m.updated,
                profile : {
                    email: m.profile.email,
                    real_name: m.profile.real_name,
                    display_name: m.profile.display_name
                    }
            }, 'import');
        }
        })
    }

    return {numUsers: numUsers};
}


/* Set up the database connection and start the server */
let mongoUri = "mongodb://" + process.env.DB_HOST;
if (Number.isInteger(Number(process.env.DB_PORT))) {
    mongoUri += ":" + process.env.DB_PORT;
} else if (process.env.DB_PORT) {
    console.log("Invalid connection port '" + process.env.DB_PORT + "' specified.");
}
mongoUri += "/" + process.env.DATABASE;
mongoose.connect(mongoUri, {
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    poolSize: 20,           // maintain up to 20 open sockets at a time
    useNewUrlParser: true,  // old URL parser is deprecated
});
mongoose.connection.on("connected", function () {
    console.log("Connected to database: " + mongoUri);
});
mongoose.connection.on("error", function(err) {
    console.log("Error on connection to " + mongoUri);
    console.log(err);
});
mongoose.connection.on("disconnected", function () {
    console.log("Disconnected from database: " + mongoUri);
});


const server = app.listen(5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});
