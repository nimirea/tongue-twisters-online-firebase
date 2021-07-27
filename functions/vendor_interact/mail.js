// init_constants
const {
  urls,
  main_experimenter_email,
  bookings_calendar,
  availability_calendar,
  pickup_day,
  dropoff_day,
  email_templates_dir
} = require('../init_constants')

// include nodemailer to send emails
const nodemailer = require('nodemailer');

// include mustache for templates processing
const mustache = require('mustache');

// allow cross-origin scripting so that we can send emails from local
const cors = require('cors')({origin: true});

// filesystem reading
const fs = require('fs').promises;

// set process.env variable
require('dotenv').config();

// define transporter
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GOOGLE_USERNAME,
      pass: process.env.GOOGLE_PASSWORD,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
  });

let send = function (subject, message, to_email) {
  let mailOptions = {
    from: process.env.GOOGLE_USERNAME,
    to: to_email,
    subject: subject,
    text: message + "\n\nBest,\nMulti-Night Study Research Team"
  }

  transporter.sendMail(mailOptions, function(err, data) {
    if (err) {
      console.log("Could not send email to " + to_email)
      console.log(err)
    } else {
      console.log("Email to " + to_email + " sent successfully.")
    }
  });
}

exports.send = send;

let import_templates = function(template_folder) {
  var result = {}
  var promises = []
  return fs.readdir(template_folder)
    .then((files) => {

      files.forEach(file => {
        var bare_filename = file.split(".")[0]

        promises.push(fs.readFile(template_folder + '/' + file, 'utf-8').then(
            (file_text) => {
              result[bare_filename] = file_text
              return 0;
            })
          )
      })

      return(Promise.all(promises))
    })
    .then(() => {
      return result
    })
}

exports.send_as_template = function(
  subject,
  template_name,
  template_opts,
  to_email
) {

  return import_templates(email_templates_dir).then(
    (templates) => {
      let message = mustache.render(templates[template_name], template_opts);

      // actually send the email
      send(
        subject,
        message,
        to_email
      )

      return 0;
    }
  );

}

// export template object
exports.get_templates = import_templates(email_templates_dir);
