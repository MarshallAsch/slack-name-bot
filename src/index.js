require('dotenv').config({ path: process.cwd() + '/config/.env' });
//const axios = require('axios');
const qs = require('querystring');

const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const onboard = require('./onboard');
const signature = require('./verifySignature');

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
            return res.json({
                "response_type": "ephemeral",
                "text": "Sorry, you are not authorized for that. "
            });
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


      let response = "```| time | userID | teamID | email | real name | display name |\n";

      response =  history.reduce((a, c) => {
          return a + "| " + c.updated + " | " + c.userId + " | " + c.teamId + " | " + c.email + " | " + c.realName + " | " + c.displayName + " |\n";
      }, response)

      response += "```";

      var payload = {
          text: response,
      };


      if (channel_id != process.env.ADMIN_CHANNEL_ID) {
          payload.response_type = "ephemeral";
      }

      res.json(payload);
      //return axios.post(response_url, payload);

    })
    .catch((err) => {
      console.log('call to get user info failed')
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
