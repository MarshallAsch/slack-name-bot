require('dotenv').config({ path: process.cwd() + '/config/.env' });
//const axios = require('axios');

const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const users = require('./models/user');
const app = express();

const { WebClient } = require('@slack/web-api');
const slackApi = new WebClient(process.env.SLACK_ACCESS_TOKEN);

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
  res.send('<h2>The Welcome/Terms of Service app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your' +
  ' environment variables.</p>');
});

/*
 * Endpoint to receive events from Slack's Events API.
 * It handles `team_join` event callbacks.
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
        if (event.type === 'team_join' && !event.is_bot) {
          const { team_id, id } = event.user;
          onboard.initialMessage(team_id, id);

          // this will record the user
          logUser(event.user, event.type);
        }

        if (event.type === 'user_change' && !event.is_bot) {
          // this will record the user
          logUser(event.user, event.type);
        }


      } else { res.sendStatus(500); }
      break;
    }
    default: { res.sendStatus(500); }
  }
});


app.post('/command', (req, res) => {
  // extract the slash command text, and trigger ID from payload
  const { text, team_id, trigger_id, command, channel_id, user_id, response_url } = req.body;

  // Verify the signing secret
  if (signature.isVerified(req)) {
    // create the dialog payload - includes the dialog structure, Slack API token,
    // and trigger ID

    console.log(req.body);


    // first check that it is the correct command
    if (command != "/whois") {
        console.log('Not the correct command');
        return res.sendStatus(404);
    }

    slackApi.users.info({user: user_id})
    .then((result) => {

        if (!result.user.is_admin) {
            res.json({
                "response_type": "ephemeral",
                "text": "Sorry, you are not authorized for that. "
            });
            return null
        }

        // parse the userID out of the message

        var lookupId = text.match(/<@([A-Z0-9]*)\|.+>/gi);
        if (lookupId == null) {
            // then the text is not a user id

            return res.json({
                "response_type": "ephemeral",
                "text": "text is not a userId"
            });
        }
        lookupId = lookupId[0].split('|')[0].slice(2);

        return users.User.getUserHistory(team_id, lookupId);
    })
    .then((history) => {

        if (history == null) {
            return;
        }

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
        res.sendStatus(500);
    });

    //res.json({"response_type": "in_channel"});

  } else {
    console.log('Verification token mismatch');
    res.sendStatus(404);
  }
});


function logUser(user, event) {

    const userRecord = new users.User()
    .setEvent(event)
    .setTeamId(user.team_id)
    .setUserId(user.id)
    .setUpdated(user.updated)
    .setEmail(user.profile.email)
    .setRealName(user.profile.real_name)
    .setDisplayName(user.profile.display_name)
    .setDeleted(user.deleted);


    return userRecord.save();
}

// Used to run the import of all users in the workspace
async function importUsers()  {
  for await (const page of slackApi.paginate('users.list', )) {

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
}


/*
 * Endpoint to receive events from interactive message on Slack.
 * Verify the signing secret before continuing.
 */
app.post('/interactive', (req, res) => {
  const { token, user, team } = JSON.parse(req.body.payload);
  if (signature.isVerified(req)) {
    // simplest case with only a single button in the application
    // check `callback_id` and `value` if handling multiple buttons
    onboard.accept(user.id, team.id);
    res.send({ text: 'Thank you! The Terms of Service have been accepted.' });
  } else { res.sendStatus(500); }
});

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

    if (process.env.IMPORT_USERS == 1) {
        importUsers()
        .then(() => {
            console.log("imported all users");

            return res.json({
                "response_type": "ephemeral",
                "text": "imported all users."
            });
        })
        .catch((err) => {
            console.log("error Importing users!");
        })
    }

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
