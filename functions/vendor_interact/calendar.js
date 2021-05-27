// include Google APIS
const {google} = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const calendar = google.calendar('v3');
const {
  db,
  functions
} = require('../init_admin');

// allow cross-origin scripting so that we can send emails from local
const cors = require('cors')({origin: true});

// what happens when stuff goes wrong?
const ERROR_RESPONSE = {
    status: "500",
    message: "There was an error interacting with your Google calendar"
};
const TIME_ZONE = 'EST';

// set process.env variable for storing credentials
require('dotenv').config();

// arg is an object that should contain two strings:
// - arg.in = calendar to create the event in
// - arg.startTime = when the event should start (in UTC time)
// - arg.endTime = when the event should end (in UTC time)
// - arg.event_name = what should the name of this event be?
// - arg.loc = location
// will return a list of all events that match
function createEvent(arg, auth) {

  return new Promise (function (resolve, reject) {
    calendar.events.insert({
      auth: auth,
      calendarId: arg.in,
      resource: {
        'summary': arg.event_name,
        'start': {
          'dateTime': arg.startTime
        },
        'end': {
          'dateTime': arg.endTime
        },
        'location': arg.loc
      }
    }, (err, event) => {
      if (err) {
        console.log('Rejecting because of error');
        reject(err);
      }
      console.log('Request successful on calendar ID ' + arg.in);
      resolve(event.data.htmlLink)
    })
  })

}

function deleteEvent(arg, auth) {

  return new Promise (function (resolve, reject) {
    calendar.events.delete({
      auth: auth,
      calendarId: arg.in,
      eventId: arg.eventId
    }, (err, event) => {
      if (err) {
        console.log('Rejecting because of error');
        reject(err);
      }
      console.log('Request successful on calendar ID ' + arg.in);
      resolve(event.data.htmlLink)
    })
  })

}

// arg is an object that should contain two strings:
// - arg.search_in = calendar to search in (user's main calendar if none given)
// - arg.timeMin / arg.timeMax = date range to search for
// will return a list of all events that match
function findEvents(arg, auth) {

  return new Promise(function(resolve, reject) {

    let passed_args = {}

    if (!('search_in' in arg)) {
      passed_args.calendarId = "primary"
    } else {
      passed_args.calendarId = arg.search_in
    }

    if (!('minTime' in arg)) {
      passed_args.timeMin = (new Date).toISOString()
    } else {
      passed_args.timeMin = arg.minTime
    }

    if ('maxTime' in arg) {
      passed_args.timeMax = arg.maxTime
    }

    passed_args.singleEvents = true
    passed_args.auth = auth
    passed_args.orderBy = "startTime" // later processing assumes this is the case

    calendar.events.list(passed_args, (err, res) => {
      if (err) {
        console.log('Rejecting because of error');
        reject(err);
      }
      console.log('Request successful on calendar ID ' + passed_args.calendarId);
      resolve(res.data)
    });
  });

}

// arg is an object that should contain three strings:
// - arg.search_in = calendar to search in (user's main calendar if none given)
// - arg.min_time = start of time interval
// - arg.max_time = end of time interval
function checkFree(arg, auth) {
  if (!('search_in' in arg)) {
    arg.search_in = "primary"
  }

  return new Promise(function(resolve, reject) {
      calendar.freebusy.query({
        auth: auth,
        resource: {
          items: [
            {
              "id": arg.search_in
            }
          ],
          timeMin: arg.min_time,
          timeMax: arg.max_time
        }
      }, (err, res) => {
        if (err) {
          console.log('Rejecting because of error');
          reject(err);
          console.error(err)
        }

        resolve(res.data["calendars"][arg.search_in].busy)
      });
    }).then((busyTimes) => {
      if (busyTimes.length === 0) {
        return true
      } else if (busyTimes.start === arg.min_time && busyTimes.end === arg.max_time) {
        return false
      } else {
        return true
      }
    });
}

// this function will interact with the calendar
// request.body.action = string ("find", "create")
// request.body.arg = Object containing arguments for the action
exports.calendarInteract = function(action, arg = {}) {

  // authenticate before anything else
  const oAuth2Client = new OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oAuth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN
  });

  // perform the desired action
  switch (action) {
    case "find":
      return findEvents(arg, oAuth2Client)
    case "free":
      return checkFree(arg, oAuth2Client)
    case "create":
      return createEvent(arg, oAuth2Client)
    case "delete":
      return deleteEvent(arg, oAuth2Client)
    default:
      console.error("The calendarInteract function did not receive a valid action.");
      return ERROR_RESPONSE;
  }
}
