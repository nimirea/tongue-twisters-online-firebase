// initialize experiment-wide constants

// set process.env variable
require('dotenv').config();

// URLs to use for links
const urls = {
  survey: process.env.EXP_SCREENING_URL,
  exp: process.env.EXP_SESSION_URL
}

const main_experimenter_email = process.env.GOOGLE_USERNAME
const bookings_calendar = process.env.EXP_BOOKINGS_CALENDAR
const availability_calendar = process.env.EXP_AVAILABILITY_CALENDAR // calendar for experimenter availability

// what days of the week should pickup and dropoff appointments be?
const pickup_day = "Monday"
const dropoff_day = "Friday"

// default values for location
const location =  {
  name: process.env.EXP_LOCATION_NAME,
  maps_link: process.env.EXP_LOCATION_URL
}
const time_zone = process.env.EXP_TIMEZONE

const email_templates_dir = './email_templates'

module.exports = {
  urls,
  main_experimenter_email,
  bookings_calendar,
  availability_calendar,
  pickup_day,
  dropoff_day,
  email_templates_dir,
  location,
  time_zone
};
