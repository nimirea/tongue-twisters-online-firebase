const {
  DB,
  FUNCTIONS,
  ADMIN
} = require('../init_admin');
const constants = require('../init_constants')
const getters = require('./getters');
const setters = require('./setters');
const cal = require('../vendor_interact/calendar');
const mail = require('../vendor_interact/mail');
const date_utils = require('../date_utilities');

exports.checkCOVID = function(submitted_data) {

  let data = submitted_data.answers
  let result = false;

  // do the checking
  if ('symptoms' in data && data.symptoms.length > 0) {
    // showing symptoms
    result = true;
  } else if (Object.values(data).includes('Yes')) {
    result = true;
  }

  var ppt_email = "";

  // store result

  return DB.ref('ppt/' + submitted_data.ppt_id + '/lastCOVIDscreen').set(
    { 'result': result,
      'time': ADMIN.database.ServerValue.TIMESTAMP}
  )
    .then(() => {
      // get upcoming events on Google Calendar
      var now = new Date()
      var next_week = new Date()
      next_week.setDate(next_week.getDate() + 7);

      return cal.calendarInteract(
        'find',
        {
          'search_in': constants.bookings_calendar,
          'minTime': now.toISOString(),
          'maxTime': next_week.toISOString()
        }
      )
  }).then((data) => {

    let appts_to_reschedule = []

    if (result === true) {

      // cancel appointments
      if (data.items.length > 0) {
        data.items.forEach((item) => {

          let parsed_info = date_utils.parseEventTitle(item.summary)

          if (parsed_info.ppt_id === String(submitted_data.ppt_id)) {

            appts_to_reschedule.push(parsed_info.event_type)

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

      // parse the answers so we can email them to the experimenter
      let answers_string = ""
      Object.entries(submitted_data.answers).forEach(([key, value]) => {
        let question = key
        if (question !== "symptoms") {
          question = submitted_data.questions[question]
        }
        answers_string += " - " + question + ": " + String(value) + "\n"
      });

      return getters.getPptData({
        ppt_id: 'ppt/' + submitted_data.ppt_id,
        attribute: "email"
      }).then((email) => {
        return mail.send_as_template(
          "[CANCELLED] Participant " + submitted_data.ppt_id,
          "COVID_screening_failed",
          {
            ppt_id: submitted_data.ppt_id,
            answers: answers_string,
            ppt_email: email,
            appts_to_reschedule: String(appts_to_reschedule)
          },
          constants.main_experimenter_email
        )
      }).then(() => {
        return result;
      })
    } else {

      return result;
    }

  })

}

exports.checkExperimenterPW = function(data) {
  // set process.env variable
  require('dotenv').config();

  if (data === process.env.EXP_DASHBOARD_PW) {
    return DB.ref("ppt").once('value').then((snapshot) => {
      let all_data = snapshot.val()

      if (all_data !== null && all_data !== undefined) {
        Object.values(all_data).forEach((ppt_info) => {
          delete ppt_info["stimList"];
        })
      }

      return all_data;
    });
  } else {
    return "Sorry, incorrect password"
  }
}

exports.submitData = function(surveyData) {

  let is_eligible = true;

  // check whether surveyData has the right fields
  if (surveyData.available_2 === undefined ||
      surveyData.available_4 === undefined ||
      surveyData.email === undefined ||
      surveyData.native_lang === undefined ||
      surveyData.age18orolder === undefined ||
      surveyData.disorder === undefined
    ) {
    is_eligible = false;
  } else {

    // check that fields have the correct data

    if (surveyData.available_2 === 'no' || surveyData.available_4 === 'no') {
      // are they available?
      is_eligible = false;
    } else if (surveyData.native_lang !== 'English') {
      // do they not have English as native language?
      is_eligible = false;
    } else if (surveyData.disorder === 'Yes') {
      // do they have a history of disorder
      is_eligible = false;
    } else if (surveyData.age18orolder === 'No') {
      // are they younger than 18?
      is_eligible = false;
    } else if (surveyData.headphones.length === 0) {
      // is the headphones array empty?
      is_eligible = false;
    } else if (surveyData.microphones.length === 0) {
      // do they have a microphone?
      is_eligible = false;
    } else if (surveyData.microphones.length === 1 && surveyData.microphones[0] === 'Microphone on Bluetooth headphones') {
      // is their only microphone part of Bluetooth headphones?
      is_eligible = false;
    }

  }

  // process data to upload
  if (is_eligible === true) {
    let to_upload = surveyData
    to_upload.eligible = is_eligible

    // set participant_id
    var participant_id = "email/" + to_upload.email.replace(/\./gi, "|")

    // get exp_ver if this participant already exists in the database
    return DB.ref(participant_id).once('value')
    .then(
      (snapshot_pptData) => {
        let ppt_data = snapshot_pptData.val()
        let state_set = false
        let exp_ver_set = false

        if (ppt_data !== null) {
          state_set = (ppt_data.state !== undefined && ppt_data.state !== null)
          exp_ver_set = (ppt_data.exp_ver !== undefined && ppt_data.exp_ver !== null)
        }

        if (state_set === false) {
          to_upload.state = "consent-form"
        } else {
          to_upload.state = ppt_data.state
        }

        if (exp_ver_set === false) {
          // set experiment version randomly
          to_upload.exp_ver = (Math.random() >= 0.66 ? 2 : 4);
        } else {
          to_upload.exp_ver = ppt_data.exp_ver
        }

        console.log(to_upload)

        return DB.ref(participant_id).set(to_upload);
    })
    .then(() => {
      // check whether study is full
      return getters.getAvailableTimeslots(include_dropoffs = false);
    })
    .then((available_timeslots) => {

        if (available_timeslots.length === 0) {
          // we are out of timeslots
          return setters.addToWaitingList(to_upload.email)
            .then(() => {
              return {
                'study_length': to_upload.exp_ver,
                'is_eligible': is_eligible,
                'waiting_list': true
              }
            })
        } else {
          return mail.send_as_template(
            "Participating in Multiple-Day Research Study",
            "consent_link",
            {
              consent_link: "https://" + constants.urls.exp + "/?email=" + to_upload.email
            },
            to_upload.email
          ).then(() => {
            return {
              'study_length': to_upload.exp_ver,
              'is_eligible': is_eligible,
              'waiting_list': false
            };
          });
        }
      });

    } else {
      return {
        'study_length': 0,
        'is_eligible': is_eligible
      }
    }

}
