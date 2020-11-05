const functions = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
admin.initializeApp();

// returns the correct prolific completion URL if the data is written
//  to the database
// params:
//  - data.participant_id: the user ID
//  - data.day = the day in question, as an integer
// returns: object containing
//  - is_incomplete = 0 if no errors, 1 otherwise
//  - message = completion URL if no errors, list of errors otherwise
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

    // TODO figure out how to check for audio files (is this necessary?)

    // // check for at least one audio file
    // var listRef = functions.storage().ref().child(data.participant_id + '/' + data.day);
    // let n_audio_files = 0;
    //
    // listRef.listAll().then((res) => {
    //   res.items.forEach(() => {
    //     n_audio_files = n_audio_files + 1
    //   });
    // }).catch((error) => {
    //   console.log("Error occurred.")
    // }).then(() => {
    //
    //   if (n_audio_files === 0) {
    //     return_value.message.push("No audio files uploaded.")
    //   }
    //
    // });

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
