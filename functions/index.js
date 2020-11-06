const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

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
  let return_value = {
    'is_incomplete': 0,
    'message': []
  };

  // initialize database
  var db = admin.database();
  return db.ref(data.participant_id).once('value').then((snapshot) => {

    let db_data = snapshot.val();

    if (db_data == null) {
      return_value.message.push("No data in database for this user.")
    } else {

      // consent on file for user?
      if (!("consent" in db_data) || !(data.day in db_data.consent)) {
        return_value.message.push("No consent form on file.")
      }

      // survey on file for user?
      if (!("surveyData" in db_data) || !(data.day in db_data.surveyData)) {
        return_value.message.push("No data recorded for today's survey.")
      }

    }

    // NOTE: don't need to check for STQ, since it's submitted in the same go as the survey

  }).then(() => {
    if (return_value.message.length > 0) {
      return_value.is_incomplete = 1;
    } else {
      return_value = {
        'is_incomplete': 0,
        'message': completionURL + endStrings[data.day - 1]
      }
    }
    return return_value;
  });
});

//
// (i.e., a unique integer) if no no participant_id has been provided in
// data. This limits read access to the database by users, making it truly
// private.
/**
* Sets participant ID based on the number of users in the database so far
* (i.e., a unique integer) if no no participant_id has been provided in
* data. This limits read access to the database by users, making it truly
* private.
* @param {String} data a participant ID or null (if none provided in URL)
* @return {Promise} with a data {String} containing the modified participant ID
*/
exports.setParticipantId = functions.https.onCall((data) => {
  let result_value = data;

  // initialize database
  var db = admin.database();

  return db.ref().once('value').then((snapshot) => {

    // replace with a unique index if no PROLIFIC_PID provided
    if (data === null) {
      result_value = snapshot.numChildren();
    }

    return result_value;

  });

});
