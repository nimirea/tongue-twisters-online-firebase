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

    if (db_data === null) {
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
      } else if (snapshot_ldc.val() !== data.day - 1) {
        result_value.prevDayIncomplete = true;
      }

      return(result_value);

    })


})

/**
* Gets the time of consent for a certain participant on a certain day.
* @param {String} data an object containing...
* @param {String} data.participant_id the participant ID
* @param {Number} data.day the day to query
* @return {Promise} with a data {Array} containing stim_ids of all stimuli
*   presented on the queried day
*/
exports.getConsentTime = functions.https.onCall((data) => {

  if (data.participant_id === null || data.day === null) {
    return null;
  } else {
    return db.ref(data.participant_id + '/consent/' + data.day).once('value').then((snapshot_consent) => {
      if (snapshot_consent.exists()) {
        return snapshot_consent.val();
      } else {
        return null;
      }

    });
  }

})

/**
* Gets participant data that is persistent across sessions, if it's been set.
* If not, return a randomly chosen one.
* @param {String} participant_id a participant ID or null (if none provided in URL)
* @return {Promise} with a data {Object} containing:
*  - cb_cond {String} counterbalancing condition of participant
*  - exp_cond {String} experimental condition of participant (onset/coda)
*/
exports.getParticipantConds = functions.https.onCall((participant_id) => {

  // randomly pick a variable from an array
  function pick_random(array) {
    return(array[Math.floor(Math.random() * array.length)])
  }

  function change_if_null(received_value, possible_options) {
    if (received_value === null) {
      return pick_random(possible_options)
    } else {
      return received_value
    }
  }

  // options for each variable
  let cb_opts = ["AE->F; IH->S", "AE->S; IH->F"];
  let exp_opts = ["onset", "coda"];

  // set variable that will be returned (initialize with random values)
  let result_value = {}

  if (participant_id === null) {
    result_value.cb_cond = pick_random(cb_opts);
    result_value.exp_cond = pick_random(exp_opts);

    return result_value;
  } else {
    return db.ref(participant_id).once('value')
      .then((snapshot_pptData) => {
        pptData = snapshot_pptData.val();

        if (pptData === null) {
          result_value.cb_cond = pick_random(cb_opts);
          result_value.exp_cond = pick_random(exp_opts);
        } else {
          result_value.cb_cond = change_if_null(
            pptData.cbCond,
            cb_opts
          );
          result_value.exp_cond = change_if_null(
            pptData.expCond,
            exp_opts
          );
        }

        return result_value
      })
    }

})

/**
* Gets the stimulus list that was presented on a certain day
* @param {String} data an object containing...
* @param {String} data.participant_id the participant ID
* @param {Number} data.day the day to query
* @return {Promise} with a data {Array} containing stim_ids of all stimuli
*   presented on the queried day
*/
exports.getStims = functions.https.onCall((data) => {

  if (data.participant_id === null || data.day === null) {
    return null;
  } else {
    return db.ref(data.participant_id + "/stimList/" + data.day).once('value')
      .then((snapshot_prevStims) => {

        if (!snapshot_prevStims.exists()) {
          return null
        } else {
          return snapshot_prevStims.val().map(item => {
            return item.stim_id
          });
        }

      });
  }

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

/**
* Upload information to the realtime database.
* @param {Object} data with information to be uploaded. Must contain:
* @param {String} data.participant_id participant ID
* @param {Number} data.day current day (if you have day-by-day attributes to
*   push)
* @return {Promise} with a result code (1 = success, 0 = fail)
*/
exports.uploadData = functions.https.onCall((data) => {

  if (!('participant_id' in data)) {
    return 0;
  } else {

    let ppt_id = data.participant_id;

    // permanent attributes, that shouldn't change from day to day
    let permanent_attr = ['expCond', 'cbCond', 'lastDayCompleted', 'stq']

    Object.entries(data).forEach(([key, value]) => {

      if (key !== 'day' && key !== 'participant_id' && permanent_attr.indexOf(key) < 0) {

        if (!('day' in data)) {
          return 0;
        } else {

          // if we're storing consent time, grab that from the server
          if (key === 'consent') {
            value = admin.database.ServerValue.TIMESTAMP;
          }

          // store values that are different per day
          db.ref(ppt_id + "/" + key + "/" + data.day).set(value);
        }

      } else if (permanent_attr.indexOf(key) >= 0) {
        // values that only need to be written once per participant
        db.ref(ppt_id + "/" + key).set(value);
      }

      return 1;

    })

    return 1;

  }

});
