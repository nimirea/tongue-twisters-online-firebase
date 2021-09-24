const {
  DB,
  FUNCTIONS,
  ADMIN
} = require('../init_admin');

const constants = require('../init_constants')

// import mailing functions
const mail = require('../vendor_interact/mail');

// import mustache for templating emails
const mustache = require('mustache')

// import calendar interaction functions
const cal = require('../vendor_interact/calendar');

// import functions for initializing attributes
const init_attributes = require('../init_attributes');

const date_utils = require('../date_utilities');

// functions
const form_processing = require('./form_processing')
const getters = require('./getters')
const setters = require('./setters')

/**
* Check if the current time is before/after the given time by a number of
* hours, and, if so, perform some function.
* @param {Date} anchorTime a date to serve as an "anchor" for the desired
*               runtime
* @param {Function} functionToRun a function to run at the runtime (or
                    runInterval minutes after)
* @param {Object} argsToFunction object that gets passed into the function
* @param {Object} localRunTime when to run this function, based on the date of
                  anchorTime. Two children: hours and mins, both numbers
* @param {Number} offsetHours the number of hours before (if negative) or
                  after (if positive)
* @param {Number} runInterval how often this function will run, in minutes
*/
let sendWhen = function(
  functionToRun,
  argsToFunction = null,
  anchorTime = null,
  localRunTime = null,
  offsetHours = 0,
  runInterval = 30
) {

  let now = new Date();

  // console.log('anchorTime: ' + anchorTime.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

  // calculate the runtime
  let runTime = new Date();
  runTime.setTime(anchorTime.getTime());
  runTime.setHours(anchorTime.getHours() + offsetHours);

  if (localRunTime !== null) {

    // convert localRunTime to ISO
    let newHours = (localRunTime.hours + 5) % 24

    // console.log('newHours: ' + newHours)

    runTime.setHours(newHours);
    runTime.setMinutes(localRunTime.mins);

    // if the runTime ends up being after anchorTime (which should not be the case), push it back 24 hours
    let timeDiffAnchorRun = date_utils.getTimeDiff(runTime, anchorTime)
    if (timeDiffAnchorRun.dates.later === runTime.getTime() && offsetHours <= 0) {
      runTime.setDate(runTime.getDate() - 1);
    }

  }

  // console.log('runTime: ' + runTime.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

  // calculate difference between now and the runtime
  let timeDiff = date_utils.getTimeDiff(now, runTime, units="minutes")

  if (timeDiff.diff < runInterval && timeDiff.dates.later === now.getTime()) {

    return functionToRun(argsToFunction);

  } else {

    return 0;

  }

}

/**
* Function that sends a reminder email the morning before an appointment.
* @param {Object} item the event object returned from Google Calendar
* @return {Promise} from mailing a template
*/
let appointmentReminder = function(item) {

  let appt_start_time = date_utils.formatDate(date_utils.parseISOLocal(item.start.dateTime)).time

  // what will actually be used?
  let ppt_info = date_utils.parseEventTitle(item.summary);

  let appt_name = ""
  if (ppt_info.event_type === "pickup") {
    appt_name = "Pick-up";
  } else if (ppt_info.event_type === "dropoff") {
    appt_name = "Drop-off"
  }

  return mail.send_as_template(
    "[RESPONSE REQUESTED] " + appt_name + " Appointment Tomorrow",
    "appointment_reminder",
    {
      appt_type: appt_name.toLowerCase(),
      appt_length_mins: constants.appt_length_mins,
      time_formatted: appt_start_time,
      instructions: ppt_info.event_type === "dropoff" ? " Please bring your activity monitor (Fitbit) to the appointment." : "",
      loc: constants.location,
      covid_screener_link: "https://" + constants.urls.exp + "/covid-screener?ppt=" + ppt_info.ppt_id,
      parking_instructions: constants.parking_instructions
    },
    ppt_info.ppt_email
  );

  // console.log("would send [RESPONSE REQUESTED] Appointment Today")
  // return 1

}

/**
* Function that sends a reminder email the morning before an appointment.
* @param {Object} item the event object returned from Google Calendar
* @return {Promise} from mailing a template
*/
let startTaskReminder = function(item) {

  // what will actually be used?
  let ppt_info = date_utils.parseEventTitle(item.summary);

  // check if started
  if (ppt_info.event_type === "dropoff") {
    return DB.ref('ppt/' + ppt_info.ppt_id + '/startedTime').once('value')
      .then((snapshot) => {
        if (snapshot.val() !== null) {
          return 0
        } else {

          let latest_start_datetime_raw = null

          return getters.calcLatestStartTimeFromDropoff(item)
            .then((lsdr) => {

              latest_start_datetime_raw = lsdr

              return getters.getPptData(
                {
                  'ppt_id': 'ppt/' + ppt_info.ppt_id,
                  'attribute': 'exp_ver'
                })
            }).then((exp_ver) => {

              let maxCompensation = exp_ver * 10

              return mail.send_as_template(
                "Tongue-Twister Study Reminder",
                "study_start_reminder",
                {
                  dropoff_datetime_formatted: date_utils.formatDate(date_utils.parseISOLocal(item.start.dateTime)).full,
                  latest_start_time_formatted: date_utils.formatDate(latest_start_datetime_raw).time,
                  max_amount: maxCompensation,
                  study_link: "https://" + constants.urls.exp + "/session?ppt=" + ppt_info.ppt_id + "&day=1"
                },
                ppt_info.ppt_email
              )
            // })

            // console.log("would send study_start_reminder")
            // return 1;
          })

        }


      })

  } else {
    return 0;
  }

}

/*
* Function that reminds participants to fill out the COVID survey.
*
*/
let remindCOVIDScreener = function(item) {

  // what will actually be used?
  let ppt_info = date_utils.parseEventTitle(item.summary);
  let is_completed = false;

  // check if COVID Screener has been filled out
  return DB.ref('ppt/' + ppt_info.ppt_id + '/lastCOVIDscreen').once('value').
    then((result) => {

      if (result.val() !== null && result.val() !== undefined) {
        // check if it's old
        let lastScreenTimestamp = result.val().time;
        let lastScreenTime = new Date(lastScreenTimestamp);
        let now = new Date()

        let daysSinceScreen = date_utils.getTimeDiff(lastScreenTime, now, units = "days")

        if (daysSinceScreen.diff < 1 && daysSinceScreen.dates.earlier === lastScreenTime.getTime()) {
          is_completed = true;
        }
      }

      if (is_completed === false) {
        let why = "—otherwise, your appointment will be automatically cancelled"
        let thanks = ""
        if (ppt_info.event_type !== "pickup") {
          why = ""
          thanks = "Thanks in advance for helping us keep our participants and researchers safe!"
        }

        return mail.send_as_template(
          "COVID Form Not Completed",
          "COVID_screening_reminder",
          {
            why_message: why,
            thanks_message: thanks,
            covid_screener_link: "https://" + constants.urls.exp + "/covid-screener?ppt=" + ppt_info.ppt_id
          },
          ppt_info.ppt_email
        )

        // console.log("would send COVID Form Not Completed")
        // return 1;
      } else {
        return 0;
      }

    })

}

let runAllFunctions = function() {
  // get all events from now until next week
  var now = new Date()
  var next_week = new Date()
  next_week.setDate(next_week.getDate() + 7);

  return cal.calendarInteract(
    'find',
    {
      'search_in': constants.bookings_calendar,
      'minTime': now.toISOString(),
      'maxTime': next_week.toISOString()
    }
  ).then(async (data) => {
    if (data.items.length === 0) {
      // nothing to parse here!
      return 0
    } else {
      // console.log(data.items);

      // daily 8am emails
      let dailyRunTime = {
        hours: constants.daily_email_time,
        mins: 0
      }

      /* eslint-disable no-await-in-loop */
      for (let item of data.items) {

        // console.log(dailyRunTime);

        // dropoff appointments only
        if (date_utils.parseEventTitle(item.summary).event_type === "dropoff") {

          getters.calcLatestStartTimeFromDropoff(item)
            .then(async (last_starttime) => {

              console.log("last start_time: " + last_starttime)

              await sendWhen(
                functionToRun = startTaskReminder,
                argsToFunction = item,
                anchorTime = last_starttime,
                localRunTime = dailyRunTime
              );

              return 0;

            })
            .catch((error) => {
              console.log(error);
              return 1;
            })

        }

        // ignore events if they've been rescheduled
        if (date_utils.parseEventTitle(item.summary).event_note !== "rescheduled") {

          await sendWhen(
            functionToRun = appointmentReminder,
            argsToFunction = item,
            anchorTime = date_utils.parseISOLocal(item.start.dateTime),
            localRunTime = null,
            offsetHours = -24
          )

          // emails before specific events
          await sendWhen(
            functionToRun = remindCOVIDScreener,
            argsToFunction = item,
            anchorTime = date_utils.parseISOLocal(item.start.dateTime),
            localRunTime = null,
            offsetHours = -2
          );
        }


      }
      /* eslint-enable no-await-in-loop */

      return 0;
    }
  });
}

module.exports = {
  sendWhen,
  appointmentReminder,
  runAllFunctions
}
