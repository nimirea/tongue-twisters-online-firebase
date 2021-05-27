// utilities for dates
const MS_IN_A = {
  ms: 1,
  second: 1000,
  minute: 1000 * 60,
  hour: 1000 * 60 * 60,
  day: 1000 * 60 * 60 * 24
}

// function for parsing dates from GCal
exports.parseISOLocal = function (s) {
  // var b = s.split(/\D/);
  // return new Date(b[0], b[1]-1, b[2], b[3], b[4], b[5]);

  return new Date(s)
}

// format Date
exports.formatDate = function (date_obj) {
  let locale_string = date_obj.toLocaleString("en-US", {timeZone: "America/Chicago"})
  locale_string = locale_string.replace(", ", " at ")
  locale_string = locale_string.replace(/:\d\d /, " ") // take out the seconds, we literally never need that

  let split_string = locale_string.split(" at ")

  return {
    'date': split_string[0],
    'time': split_string[1],
    'full' : locale_string,
    'full_timefirst' : split_string[1] + " on " + split_string[0]
  }

}

// parse event title
exports.parseEventTitle = function (event_title) {
  // check if we have a special note ahead at the beginning
  let event_note = ''
  if (event_title.indexOf('] ') > -1) {
    event_note = event_title.match(/(?<=\[)(.*)(?=\])/gm)[0];
    event_title = event_title.match(/(?<=\] )(.*)/gm)[0];
  }

  let info_list = event_title.split(": ")
  let ppt_info_from_calendar = info_list[1].substring(0, info_list[1].length - 1).split(" (")

  // what will actually be used?
  return {
    'ppt_id': ppt_info_from_calendar[0],
    'ppt_email': ppt_info_from_calendar[1],
    'event_type': info_list[0],
    'event_note': event_note
  }
}

// Returns the ISO week of the date. from: https://weeknumber.net/how-to/javascript
exports.getWeek = function(date_obj) {
  var date = new Date(date_obj.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
* Return time difference between two date objects, as well as an Object that
* includes the dates based on which one is earlier, and which one is later.
* @param {Date} date_obj1 First date object
* @param {Date} date_obj2 Second date object
* @param {String} units Unit to put results in. Possibilities are:
*                 - ms
*                 - seconds
*                 - minutes
*                 - hours
*                 - days
* @return {Object} with the following structure:
*         {
*            'diff': time_difference {Number}
*            'dates': {
*              'earlier': Date obj that is earlier {Date}
*              'later': Date obj that is later {Date}
*            }
*          }
*/
exports.getTimeDiff = function(date_obj1, date_obj2, units = "ms") {
  let result = {}

  // constants array is formatted in the singular
  if (units !== "ms") {
    units = units.slice(0, -1);
  }

  // calculate the time_difference
  result.diff = Math.abs(date_obj1.getTime() - date_obj2.getTime()) / MS_IN_A[units]

  // calculate which is earlier and which is later
  result.dates = {
    'earlier': Math.min(date_obj1, date_obj2),
    'later': Math.max(date_obj1, date_obj2)
  }

  return result;
}
