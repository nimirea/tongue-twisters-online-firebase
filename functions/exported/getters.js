const {
  DB,
  FUNCTIONS,
  ADMIN
} = require('../init_admin');
const cal = require('../vendor_interact/calendar')
const constants = require('../init_constants')
const init_attributes = require('../init_attributes')
const date_utils = require('../date_utilities')

/**
* Get still-available timeslots
* @return {Promise} with a data array containing the reponse
*/
let getAvailableTimeslots = function (include_dropoffs = true) {
  if (include_dropoffs === null) {
    include_dropoffs = true;
  }
  var events_list;
  var prev_booked;

  // set the start time for date search to tomorrow, because you should only be allowed to sign up 24 hours in advance
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return cal.calendarInteract("find", {
    minTime: tomorrow.toISOString(),
    search_in: constants.availability_calendar
  }).then((data) => {
      events_list = data.items;

      if (events_list === undefined || events_list.length === 0) {
        return [];
      } else {

        // find all slots that have been set up
        return cal.calendarInteract("find", {
          search_in: constants.bookings_calendar,
          minTime: events_list[0].start['dateTime'],
          maxTime: events_list[events_list.length - 1].end['dateTime']
        }).then((data) => {

          // store start time in prev_booked only
          prev_booked = data.items.map(function(item) {
            // translate to UTC time
            return date_utils.parseISOLocal(item.start['dateTime']).toISOString()
          });

          // parameters for splitting up slots
          let appt_slots = []
          let appt_length = 15 // appointment length in minutes
          let time_markers = ["startTime", "endTime"]
          let date_divider = ", "
          let blockInfo = {}
          let weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

          // store all available appointment blocks in appt_blocks
          for (var cal_event in events_list) {

            blockInfo = {
              startTime: date_utils.parseISOLocal(events_list[cal_event].start['dateTime']),
              endTime: date_utils.parseISOLocal(events_list[cal_event].end['dateTime'])
            }
            blockInfo.dayOfWeek = blockInfo.startTime.getDay() // 1 for Monday, 5 for Friday
            blockInfo.week = date_utils.getWeek(blockInfo.startTime)

            if (include_dropoffs === true || weekdays[blockInfo.dayOfWeek] !== constants.dropoff_day) {

              // split block into 15-minute chunks
              for (var slot_idx = 0 ; slot_idx < 60/appt_length; slot_idx++ ) {

                slotInfo = {
                  dayOfWeek: weekdays[blockInfo.dayOfWeek],
                  week: blockInfo.week, // for filtering by appointments in same week
                  slotIdx: slot_idx,
                  offsetMins: []
                }

                for (var tt in time_markers) {
                  tt = Number(tt)
                  let time_type = time_markers[tt]
                  adjusted_time = new Date(blockInfo.startTime)
                  adjusted_time.setMinutes( adjusted_time.getMinutes() + (slot_idx + tt) * appt_length)

                  slotInfo[time_type] = adjusted_time.toISOString()
                  slotInfo[time_type + "_local"] = adjusted_time.toLocaleString("en-US", {timeZone: "America/Chicago"});
                }

                // check that this slot isn't booked already
                if (!(prev_booked.includes(slotInfo.startTime))) {

                  // manipulate strings for Chicago time
                  let startInfo = slotInfo.startTime_local.split(date_divider)
                  let stopTime = slotInfo.endTime_local.split(date_divider)[1].replace(":00 ", " ")
                  let startTime = startInfo[1].replace(":00 ", " ")
                  slotInfo["label"] = startTime + " to " + stopTime + " on " + slotInfo.dayOfWeek + ", " + startInfo[0];

                  appt_slots.push(slotInfo)
                }
              }

            }

          }

          return appt_slots
        });
      }
    })
}

/**
* Get booked timeslots
* @param args.minTime {String} 'time to start searching', as ISO string
* @param args.maxTime {String} 'time to end search', as ISO string
*
* @return {Object} Booked timeslots from a certain timeframe
*/
let getBookedTimeslots = function(args) {
  return cal.calendarInteract(
    'find',
    {
      'search_in': constants.bookings_calendar,
      'minTime': args.minTime,
      'maxTime': args.maxTime
    }
  ).then((data) => {
    let parsed_titles = data.items.map((item) => {
      let parsed_title = date_utils.parseEventTitle(item.summary);
      return parsed_title;
    });
    return parsed_titles;
  })
}

// get participant data
// - ppt_id_changed: participant ID was changed
// - args.attribute: string or list of strings for attribute to return
// - ppt_id: participant ID to get the data for
// - set_if_null: set value if null
let getPptData = function getPptData(args) {

  // change ppt_id if needed
  let ppt_id_changed = false
  if (args.ppt_id_changed === true) {
    ppt_id_changed = true
  }
  let ppt_id = args.ppt_id
  console.log("CURRENT PPT_ID " + ppt_id)
  console.log("CURRENT ATTRIBUTES " + args.attribute)

  return DB.ref(args.ppt_id).once('value')
    .then((snapshot) => {

      result = snapshot.val()

      if (result === null ) {
        return null
      } else {

        if (ppt_id.startsWith("email/") && Object.keys(result).includes("ppt_id")) {
          // console.log("recursing on getPptData")

          return getPptData(
            {
              'ppt_id': 'ppt/' + result.ppt_id,
              'attribute': args.attribute,
              'ppt_id_changed': true
            }
          )
        } else {

          // multiple bits of data at once
          if (Array.isArray(args.attribute)) {
            let orig_keys = Object.keys(result)

            // set random value if we need to
            args.attribute.forEach((key) => {
              if (!(orig_keys.includes(key)) && args.set_if_null === true) {
                let new_val = init_attributes.initialize(key, result.exp_ver)
                DB.ref(args.ppt_id + '/' + key).set(new_val)
                result[key] = new_val
              }
            })

            // delete unneeded keys
            orig_keys.forEach((key) => {
              if (!(args.attribute.includes(key))) {
                delete result[key];
              }
            })

            // add in ppt_id, if we've removed it and jumped to the ppt_id identifier
            if (args.attribute.includes("ppt_id") && ppt_id.startsWith("ppt/")) {
              result["ppt_id"] = ppt_id.split("/")[1]
            }

          } else {

            if (!(args.attribute in result) && args.set_if_null === true) {
              result = init_attributes.initialize(args.attribute, result.exp_ver)
              DB.ref(args.ppt_id + '/' + key).set(result)
            } else {
              result = result[args.attribute]
            }
          }

          // if participant id has changed, return that
          if (ppt_id_changed === true) {

            var result_data = result
            if (!(Array.isArray(args.attribute))) {
              result_data = {}
              result_data[args.attribute] = result
            }

            result = Object.assign(
              {
                new_ppt_id: args.ppt_id
              },
              result_data
            )
          }
          console.log("THIS IS THE RESULT ")
          return result;

        }
      }

    })

}

let getStartTime = function (data) {
  return DB.ref('ppt/' + data.participant_id + '/startedTime/' + data.day).once('value')
    .then((snapshot) => {
      return snapshot.val();
    })
}

let getStims = function(data) {
  return DB.ref('ppt/' + data.participant_id + '/stimList/' + data.day).once('value')
    .then((snapshot) => {
      let returned_stims = snapshot.val();

      return returned_stims.map(
        (item) => {
          return item.stim_id
        }
      )
    });
}

/**
* Get last day completed in the database.
* @param {Object} data an object containing:
* @param {String} data.participant_id the participant's PROLIFIC_PID
* @param {Number} data.day the day the participant is trying to access
* @return {Promise} with a data {Object} containing...
*   - alreadyDone {bool} whether the participant has already completed the
*     current day
*   - prevDayIncomplete {bool} whether the participant has left the previous
*     day incomplete.
*/
let calcCompletionStatus = function(data) {

  // initialize with the "valid" values
  let result_value = {
    alreadyDone: false,
    prevDayIncomplete: false
  };

  // check if participant completed the correct number of days
  return DB.ref('ppt/' + data.participant_id + '/completionTime').once('value')
    .then((snapshot_ldc) => {
      // day 1 is excluded from this calculation
      if (snapshot_ldc.val() !== null) {

        let timestamps = snapshot_ldc.val().filter((item) => {
          return !(item.isEmpty)
        })

        if (timestamps.length >= data.day) {
          result_value.alreadyDone = true;
        } else if (timestamps.length !== data.day - 1) {
          result_value.prevDayIncomplete = true;
        }

      }

      return(result_value);

    })


}

/* Calcualte latest start time that a participant should have, passing in the
* dropoff event directly so we don't have to make so many calls to calendar
*/
let calcLatestStartTimeFromDropoff = function(dropoff_event, num_hours_before = 1) {

  event_parsed = date_utils.parseEventTitle(dropoff_event.summary);

  // check whether event is actually a dropoff event
  if (event_parsed.event_type !== "dropoff") {
    console.log("Event passed to calcLatestStartTimeFromDropoff is not a dropoff event!")
    return 1;
  } else {

    let ppt_id = event_parsed.ppt_id;

    // query database for exp_ver
    return getPptData({
      'ppt_id': 'ppt/' + ppt_id,
      'attribute': 'exp_ver'
    }).then((exp_ver) => {

      // calculate latest start time based on ppt_info
      let latest_start_datetime_raw = date_utils.parseISOLocal(dropoff_event.start.dateTime);
      // set it back the number of sessions required, minus one (they might do the last session on the day of)
      latest_start_datetime_raw.setDate(latest_start_datetime_raw.getDate() - (exp_ver - 1));
      // subtract the number of hours that would be needed to get to campus (hypothetically... let's say 3 to be on the safe side?)
      latest_start_datetime_raw.setHours(latest_start_datetime_raw.getHours() - num_hours_before);

      return (latest_start_datetime_raw);

    })
  }

}

let getWaitingListLength = function() {
  return DB.ref('waiting_list').once('value')
    .then((snapshot) => {
      let waiting_list = snapshot.val()
      let result = 0

      if (waiting_list !== null) {
        result = [...new Set(Object.values(waiting_list))].length
      }

      return result;
    })
}

module.exports = {
  getAvailableTimeslots,
  getBookedTimeslots,
  getPptData,
  getStartTime,
  getStims,
  getWaitingListLength,
  calcCompletionStatus,
  calcLatestStartTimeFromDropoff
}
