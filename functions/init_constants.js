// initialize experiment-wide constants

// URLs to use for links
const urls = {
  survey: 'screening-survey.web.app',
  exp: 'tonguetwisters.online'
}

const main_experimenter_email = "multinight.study@gmail.com"
const bookings_calendar = "d5kmvkkpvnatcqnqhmggbhjtvk@group.calendar.google.com" // calendar for bookings
const availability_calendar = "primary" // calendar for experimenter availability

// // test calendars
// const bookings_calendar = "036iq5ef464nv0efg2bn1mlo2c@group.calendar.google.com"
// const availability_calendar = "fm8c8o1gvmm8rerb4c8045b1so@group.calendar.google.com"

// what days of the week should pickup and dropoff appointments be?
const pickup_day = "Monday"
const dropoff_day = "Friday"

// default values for location
const location =  {
  name: "outside Swift Hall",
  maps_link: "https://www.google.com/maps/place/42%C2%B003'18.3%22N+87%C2%B040'30.6%22W/@42.055078,-87.6757182,19z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!7e2!8m2!3d42.0550778!4d-87.6751713?hl=en"
}

const email_templates_dir = './email_templates'

module.exports = {
  urls,
  main_experimenter_email,
  bookings_calendar,
  availability_calendar,
  pickup_day,
  dropoff_day,
  email_templates_dir,
  location
};
