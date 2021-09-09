const {
  DB,
  FUNCTIONS,
  ADMIN
} = require('../init_admin');
const constants = require('../init_constants')
const getters = require('./getters');
const cal = require('../vendor_interact/calendar');
const mail = require('../vendor_interact/mail');
const date_utils = require('../date_utilities');

let addToWaitingList = function(ppt_id) {
  if (ppt_id.startsWith('ppt/') || ppt_id.startsWith('email/')) {
    return getters.getPptData({
      ppt_id: ppt_id,
      attribute: "email"
    }).then((email) => {
      return DB.ref('waiting_list').push().set(email);
    })
  } else {
    return DB.ref('waiting_list').push().set(ppt_id)
  }
}

/**
* Add appointments to Google calendar for the specified user
*/
let bookAppts = function(data) {

  if (!('participant_id' in data)) {
    return 0;
  } else {
    let insert_calls = []
    let check_calls = []
    let ppt_email = ""
    let ppt_id_number = null
    let conflict_found = false
    let ppt_demographics = "NOT PROVIDED"

    // get participant email
    return getters.getPptData(
      {
        ppt_id: data.participant_id,
        attribute: ["email", "ppt_id", "demographics"]
      }
    ).then((returned_ppt_data) => {

      console.log(returned_ppt_data)

      ppt_email = returned_ppt_data.email
      ppt_id_number = returned_ppt_data.ppt_id

      if ("demographics" in returned_ppt_data) {
        ppt_demographics = returned_ppt_data.demographics
      }

      Object.entries(data).forEach(([appt_type, appt_data]) => {
        if (appt_type !== 'participant_id') {

          // set up the checking calls
          check_calls.push(
            cal.calendarInteract(
              'find',
              {
                'search_in': constants.bookings_calendar,
                'minTime': appt_data.startTime,
                'maxTime': appt_data.endTime
              }
            ).then((data) => {
              if (data.items.length > 0) {
                return 1 // error code!
              } else {
                return 0
              }
            })
          )

          // set up the insertion calls
          insert_calls.push(
            cal.calendarInteract(
              'create',
              {
                'in': constants.bookings_calendar,
                'startTime': appt_data.startTime,
                'endTime': appt_data.endTime,
                'event_name': appt_type + ": " + ppt_id_number + " (" + ppt_email + ")",
                'loc': constants.location.name
              }
            )
          )
        }
      })

      return Promise.all(check_calls)
    }).then((check_result) => {

      // if we did find a conflict, throw error signal and end the chain there
      if (check_result.includes(1)) {
        console.log(check_result)
        return 1
      } else {
        return Promise.all(insert_calls).then(() => {

          mail.send_as_template(
            "Pick-up/Drop-off Appointment Confirmation",
            "appointment_confirmation",
            {
              completed_consent_link: "https://" + constants.urls.exp + "/?ppt=" + ppt_id_number + "&page=consent_record",
              dropoff_formatted: date_utils.formatDate(date_utils.parseISOLocal(data.dropoff.startTime)).full,
              pickup_formatted: date_utils.formatDate(date_utils.parseISOLocal(data.pickup.startTime)).full,
              appt_length_mins: constants.appt_length_mins,
              loc: constants.location
            },
            ppt_email
          );

          let ppt_demographics_string = " - email: multinight.study+" + ppt_id_number + "@gmail.com\n"

          if (ppt_demographics !== "NOT PROVIDED") {
            // parse the answers so we can email them to the experimenter
            Object.entries(ppt_demographics).forEach(([key, value]) => {
              let val = value
              if (key === "height") {
                val = value.text
              } else if (key === "weight") {
                val = String(val) + " lbs."
              }
              ppt_demographics_string += " - " + key + ": " + String(val) + "\n"
            });
          }

          mail.send_as_template(
            "New Sign-up: Participant " + ppt_id_number,
            "new_signup",
            {
              fitbit_demo_info: ppt_demographics_string
            },
            constants.main_experimenter_email
          )

          return 0
        })
      }

    })
  }
}

/**
* Upload information to the realtime database.
* @param {Object} data with information to be uploaded. Must contain:
* @param {String} data.participant_id participant ID
* @param {Number} data.day current day (if you have day-by-day attributes to
*   push)
* @return {Promise} with a result code (1 = fail, 0 = the new data)
*/
let uploadData = function(data) {

  if (!('participant_id' in data)) {
    return 1;
  } else {

    let ppt_id = data.participant_id;
    let orig_ppt_id = data.participant_id; // we may need this later, just in case
    let ppt_id_number = 0
    let carryover_ppt_data = {};
    let old_ppt_state = ""

    // permanent attributes, that shouldn't change from day to day
    let permanent_attr = ['exp_cond',
      'cb_cond',
      'lastDayCompleted',
      'stq',
      'state',
      'permissions',
      'consent',
      'consent_version',
      'demographics',
      'email',
      'exp_ver'
    ]

    // if we're storing consent info, create an official (sequential) ppt_id for this person!
    return getters.getPptData({
      ppt_id: ppt_id,
      attribute: ['exp_ver', 'email']
    }).then((ppt_data) => {

      carryover_ppt_data = ppt_data

      return DB.ref('ppt').once('value')
    }).then((snapshot) => {

        if ('consent' in data) {

          ppt_id_number = snapshot.numChildren();
          ppt_id = 'ppt/' + ppt_id_number
          data = Object.assign(data, carryover_ppt_data)

          return DB.ref(orig_ppt_id + "/state").set("appointment-booking").then(() => {
            return DB.ref(orig_ppt_id + "/ppt_id").set(ppt_id_number);
          })

        } else {

          return 0;

        }
      }).then(() => {
        Object.entries(data).forEach(([key, value]) => {

          if (key !== 'day' && key !== 'participant_id' && permanent_attr.indexOf(key) < 0) {

            if (!('day' in data)) {
              return 1;
            } else if (key === "timestamp_name") {
              // store timestamp on server
              DB.ref([ ppt_id, value, data.day].join("/")).set(ADMIN.database.ServerValue.TIMESTAMP)
            } else {
              // store values that are different per day
              DB.ref([ ppt_id, key, data.day].join("/")).set(value);

              // if the thing we're storing is a post-task survey, send email to next session
              if (key === "postTaskSurvey") {

                return getters.getPptData({
                  'ppt_id': ppt_id,
                  'attribute': ['exp_ver', 'email', 'startedTime/' + data.day]
                }).then((returned_ppt_data) => {

                  if (String(returned_ppt_data.exp_ver) !== String(data.day)) {

                    let ppt_id_raw = ppt_id.split("/")[1];
                    let tomorrow_idx = parseInt(data.day) + 1;

                    return getters.getStartTime({
                      participant_id: ppt_id_raw,
                      day: data.day
                    }).then((today_start) => {
                      let start_datetime = new Date(today_start)
                      start_datetime.setDate(start_datetime.getDate() + 1)

                      // calculate time when they should start

                      return mail.send_as_template(
                        "Day " + tomorrow_idx + " Link",
                        "study_link_n",
                        {
                          tomorrow_link: "https://" + constants.urls.exp + "/session?ppt=" + ppt_id_raw + "&day=" + tomorrow_idx,
                          this_day: data.day,
                          start_datetime_formatted: date_utils.formatDate(start_datetime).time
                        },
                        returned_ppt_data.email
                      );
                    })

                  } else {
                    return 0
                  }
                })

              }

            }

          } else if (permanent_attr.indexOf(key) >= 0) {

            // if we're storing consent time, grab that from the server
            if (key === 'consent') {
              value = ADMIN.database.ServerValue.TIMESTAMP;
            }

            // values that only need to be written once per participant
            DB.ref(ppt_id + "/" + key).set(value);
          }

          return 0;

        })

        return ppt_id;
      }).then((ppt_id) => {
        return DB.ref(ppt_id).once('value')
      }).then((snapshot) => {
        return Object.assign(snapshot.val(), {'ppt_id': ppt_id});
      })

  }

}

let sendFirstEmail = function(data) {

  // used for calculating things later
  var returned_ppt_data = {};
  var dropoff_datetime_raw;
  var latest_start_datetime_raw;

  // if there's no participant ID, we can't send the email!
  if (!('participant_id' in data)) {
    console.log("no participant ID provided to function that sends first email");
    return 1;
  } else {
    return getters.getPptData(
      {
        ppt_id: 'ppt/' + data.participant_id,
        attribute: ["email", "exp_ver"]
      }
    ).then((rpd) => {

      returned_ppt_data = rpd;

      // get time of dropoff appointment
      let now = new Date();
      let a_week_later = new Date()
      a_week_later.setDate(now.getDate() + 7);

      return cal.calendarInteract(
        'find',
        {
          'search_in': constants.bookings_calendar,
          'minTime': now.toISOString(),
          // 'maxTime': a_week_later.toISOString()
        }).then(async (found_events) => {

        let cal_ppt_info = "";
        let dropoff_item = null;
        for (item of found_events.items) {
          cal_ppt_info = date_utils.parseEventTitle(item.summary);
          if (cal_ppt_info.ppt_id === String(data.participant_id) && cal_ppt_info.event_type === "dropoff") {

            dropoff_item = item;

          }
        }

        dropoff_datetime_raw = date_utils.parseISOLocal(dropoff_item.start.dateTime);
        latest_start_datetime_raw = await getters.calcLatestStartTimeFromDropoff(dropoff_item);

        let tst = "all " + returned_ppt_data.exp_ver
        if (returned_ppt_data.exp_ver === 2) {
          tst = "both"
        }

        return mail.send_as_template(
          "Experiment Session Link (Day 1)",
          "study_link_1",
          {
            study_link: "https://" + constants.urls.exp + "/session?ppt=" + data.participant_id + "&day=1",
            total_sessions_text: tst,
            dropoff_datetime_formatted: date_utils.formatDate(dropoff_datetime_raw).full,
            latest_start_datetime_formatted_timefirst: date_utils.formatDate(latest_start_datetime_raw).full_timefirst
          },
          returned_ppt_data.email
        ).then(() => {
          // change state in database
          DB.ref('ppt/' + data.participant_id + "/state").set("dropoff")

          return 0;
        });
      })
    }).then(() => {
      return DB.ref('ppt/' + data.participant_id).once('value')
    }).then((snapshot) => {
      return snapshot.val();
    })
  }
}

/**
- data.ppt_id = participant ID, no prefix
**/
let setAsNoShow = function(ppt_id) {
  return uploadData({'participant_id': 'ppt/' + ppt_id,
                      'state': "no-show"}
    ).then(() => {
      // get upcoming events on Google Calendar
      var now = new Date()

      return cal.calendarInteract(
        'find',
        {
          'search_in': constants.bookings_calendar,
          'minTime': now.toISOString(),
        }
      )
    }).then((data) => {

      // cancel appointments
      if (data.items.length > 0) {
        data.items.forEach((item) => {

          let parsed_info = date_utils.parseEventTitle(item.summary)

          if (parsed_info.ppt_id === String(ppt_id)) {

            return cal.calendarInteract(
              'delete',
              {
                'in': constants.bookings_calendar,
                'eventId': item.id
              }
            )

          }

        })
      }

      return DB.ref('ppt/' + ppt_id).once("value")
  }).then((snapshot) => {
    return snapshot.val();
  })
}

/* notify waiting list */
let notifyWaitingList = function() {
  // get waiting list
  return DB.ref('waiting_list').once("value")
    .then(async (snapshot) => {
      let waiting_list = snapshot.val()

      if (waiting_list !== null) {

        // only unique values

        let unique_waiting_list = [...new Set(Object.values(waiting_list))];

        let process_waiting_list = unique_waiting_list.map(async (email) => {

          // check participant state
          return getters.getPptData({
            'ppt_id': 'email/' + email.replace(/\./gi, "|"),
            'attribute': 'state'
          }).then((ppt_info) => {
            let subj_line = "Sign Up for Tongue-Twisters Across Multiple Nights Study"

            if (ppt_info === 'consent-form') {

              // actually send email
              return mail.send_as_template(
                "New Slots Opened",
                "new_slots_need-consent",
                {
                  link: "https://" + constants.urls.exp + "/?email=" + email
                },
                email
              ).then(() => {
                return 0;
              })

              // console.log("should send consent form version of email")
            } else if (typeof ppt_info === 'object' && ppt_info !== null){

              if (ppt_info.state === "appointment-booking") {

                // parse participant ID
                let ppt_id = ppt_info.new_ppt_id.split("/")[1]

                return mail.send_as_template(
                  "New Slots Opened",
                  "new_slots",
                  {
                    appointment_schedule_link: "https://" + constants.urls.exp + "/?ppt=" + ppt_id,
                    consent_record_link: "https://" + constants.urls.exp + "/?ppt=" + ppt_id + "&page=consent_record"
                  },
                  email
                ).then(() => {
                  return 0;
                })

                // console.log("would send email to " + email + " ppt_id=" + ppt_id);
              } else {
                return 1; // fallback
              }

            } else {
              return 1;
            }

          })

        })

        return Promise.all(process_waiting_list).then((waiting_list_results) => {
          // check for errors
          if (waiting_list_results.includes(1)) {
            console.log("There was an error when sending emails.")
            return 1;
          } else if (waiting_list_results.length > 0) {
            console.log(String(waiting_list_results.length) + " emails sent to waiting list, deleting now.");
            return DB.ref('waiting_list').set(null).then(() => {
              return 0;
            })
          } else {
            console.log("Not enough people on the waitlist")
            return 1;
          }
        })

      } else {
        return 1;
      }

    })
}

module.exports = {
  addToWaitingList,
  bookAppts,
  uploadData,
  sendFirstEmail,
  setAsNoShow,
  notifyWaitingList
}
