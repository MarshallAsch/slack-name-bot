require('dotenv').config({ path: process.cwd() + '/config/.env' });

const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const onboard = require('./onboard');
const signature = require('./verifySignature');

const users = require('./models/user');
const app = express();

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
