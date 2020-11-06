const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// initialize database up top
const db = admin.database();

/**
* Returns the correct Prolific completion URL if the data is written to the
* database.
* @param {Object} data an object containing...
* @param {String} data.participant_id the user ID
* @param {Number} data.day the day of this session (1-4)
* @return {Promise} with a data object containing...
*   - is_incomplete {Number} 0 if no errors, 1 otherwise
*   - message {String/Array} completion URL if no errors, array of errors
*     otherwise
*/
exports.checkCompletion = functions.https.onCall((data) => {

  // completion URL strings
  let endStrings = [
    '80A5C6E2',
    '5F194114',
    '2C3ACBFE',
    '79A95D43'
  ]
  let completionURL = 'https://app.prolific.co/submissions/complete?cc=';

  // variable that will be returned at the end of this function
  let result_value = {
    'is_incomplete': 0,
    'message': []
  };

  // get this participant's snapshot data
  return db.ref(data.participant_id).once('value').then((snapshot) => {

    let db_data = snapshot.val();

    if (db_data == null) {
      result_value.message.push("No data in database for this user.")
    } else {

      // consent on file for user?
      if (!("consent" in db_data) || !(data.day in db_data.consent)) {
        result_value.message.push("No consent form on file.")
      }

      // survey on file for user?
      if (!("surveyData" in db_data) || !(data.day in db_data.surveyData)) {
        result_value.message.push("No data recorded for today's survey.")
      }

    }

    // NOTE: don't need to check for STQ, since it's submitted in the same go as the survey

  }).then(() => {
    if (result_value.message.length > 0) {
      result_value.is_incomplete = 1;
    } else {
      result_value = {
        'is_incomplete': 0,
        'message': completionURL + endStrings[data.day - 1]
      }
    }
    return result_value;
  });
});

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
exports.calcCompletionStatus = functions.https.onCall((data) => {

  // initialize with the "valid" values
  let result_value = {
    alreadyDone: false,
    prevDayIncomplete: false
  };

  // check if participant completed the correct number of days
  return db.ref(data.participant_id + '/lastDayCompleted').once('value')
    .then((snapshot_ldc) => {
      if (snapshot_ldc.val() >= data.day) {
        result_value.alreadyDone = true;
      } else if (snapshot_ldc.val() != data.day - 1) {
        result_value.prevDayIncomplete = true;
      }

      return(result_value);

    })


})

/**
* Sets participant ID based on the number of users in the database so far
* (i.e., a unique integer) if no no participant_id has been provided in
* data. This limits read access to the database by users, making it truly
* private.
* @param {String} given_ppt_id a participant ID or null (if none provided in URL)
* @return {Promise} with a data {String} containing the modified participant ID
*/
exports.setParticipantId = functions.https.onCall((given_ppt_id) => {
  let result_value = given_ppt_id;

  return db.ref().once('value').then((snapshot) => {

    // replace with a unique index if no PROLIFIC_PID provided
    if (given_ppt_id === null) {
      result_value = snapshot.numChildren();
    }

    return result_value;

  });

});
