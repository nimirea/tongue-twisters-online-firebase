const {
  DB,
  FUNCTIONS,
  ADMIN
} = require('./init_admin');

require('dotenv').config();

const constants = require('./init_constants')

// // require cors
const cors = require('cors')({origin: true});

// import mailing functions
const mail = require('./vendor_interact/mail');

// import mustache for templating emails
const mustache = require('mustache')

// import calendar interaction functions
const cal = require('./vendor_interact/calendar');

// import functions for initializing attributes
const init_attributes = require('./init_attributes');

const date_utils = require('./date_utilities');

// functions
const form_processing = require('./exported/form_processing')
const getters = require('./exported/getters')
const setters = require('./exported/setters')
const scheduled = require('./exported/scheduled')

// export to interface:
module.exports = {
  'checkCOVID': FUNCTIONS.https.onCall(form_processing.checkCOVID),
  'checkExperimenterPW': FUNCTIONS.https.onCall(form_processing.checkExperimenterPW),
  'submitData': FUNCTIONS.https.onCall(form_processing.submitData),
  'getPptData': FUNCTIONS.https.onCall(getters.getPptData),
  'getAvailableTimeslots': FUNCTIONS.https.onCall(getters.getAvailableTimeslots),
  'getApptLoc': FUNCTIONS.https.onCall(getters.getApptLoc),
  'getBookedTimeslots': FUNCTIONS.https.onCall(getters.getBookedTimeslots),
  'getStartTime': FUNCTIONS.https.onCall(getters.getStartTime),
  'getStims': FUNCTIONS.https.onCall(getters.getStims),
  'getWaitingListLength': FUNCTIONS.https.onCall(getters.getWaitingListLength),
  'calcCompletionStatus': FUNCTIONS.https.onCall(getters.calcCompletionStatus),
  'addToWaitingList': FUNCTIONS.https.onCall(setters.addToWaitingList),
  'bookAppts': FUNCTIONS.https.onCall(setters.bookAppts),
  'uploadData': FUNCTIONS.https.onCall(setters.uploadData),
  'sendFirstEmail': FUNCTIONS.https.onCall(setters.sendFirstEmail),
  'setAsNoShow': FUNCTIONS.https.onCall(setters.setAsNoShow),
  'notifyWaitingList': FUNCTIONS.https.onCall(setters.notifyWaitingList)
}

// **** SCHEDULED FUNCTIONS *****

module.exports.everyThirtyMins = FUNCTIONS.pubsub.schedule('every 30 minutes')
  .timeZone(constants.timezone) // Users can choose timezone - default is America/Los_Angeles
  .onRun((context) => { return scheduled.runAllFunctions(); });
