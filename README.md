# Speech Experiments Code

## Purpose

This directory contains code for running the speech experiments (and scheduling participants) on a Firebase instance. The speech experiments are written using the Vue.js framework on the front end, and Firebase on the backend.

## Usage Guide

### Technical Setup

Here are steps for how to get your study online, under a Firebase project that you have control over.

#### 1. Install Firebase and Other Required Packages Locally

1. Create a Google Firebase account, if you don't have one already.
2. Install the [https://firebase.google.com/docs/cli/](Firebase CLI) on your local machine
3. Set up a Firebase project first. Make sure that you select the Blaze plan, which lets you use cloud functions. At the time of writing, it is quite cheap to host data on there—I do not expect to pay more than \$1 total to run about 100 participants in this experiment.
4. Run `firebase init` in _this_ directory. Add the realtime database, hosting, storage, pubsub, and emulators as options. Link it to your just-created project.
5. Run `npm install` inside this directory to update packages as needed.

#### 2. Configuration Setup

Before spinning up your dev server or pushing to Firebase, you'll also need to set your configuration variables in `functions/.env`. A sample configuration file `functions/.env.sample` is provided. `functions/.env` should contain:

##### Google Account Details (`GOOGLE_USERNAME`, `GOOGLE_PASSWORD`)

For scheduling participants and sending out reminder emails, your Firebase project must have access to the Google Calendar and Gmail APIs. I recommend creating a separate Google account for this purpose (e.g. `official.study.email@gmail.com`). This does not need to be the Google account that created the Firebase project, but if you created the Firebase app using your GSuite account, this account should also be a GSuite account within the same organization.

In `functions/.env`:

* `GOOGLE_USERNAME` is the email address for the study's Google account
* `GOOGLE_PASSWORD` is the password for the study's Google account

##### Google API Setup (`OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`)

Technically, it's not the project that has access to the APIs—it's a consent screen app _associated with_ the project, which must be registered with Google. Here are steps for setting this up:

1. Go to the [Google Cloud Platform page](https://console.cloud.google.com), and select your project from the dropdown list on the top left.
2. Go to "APIs & Services" > "Library" and add the Gmail and Google Calendar APIs.
3. Go to "APIs & Services" > "OAuth consent screen"
4. Follow the steps for associating an app with your project. If you're not using a GSuite account, select "External", and keep your app in testing mode.
5. When you reach "Scopes", click on the link in the info box to the Google API Library. Search for the Gmail and Google Calendar APIs, and add them to your app.
6. Add the Google account for your study as a test user.
7. Follow the instructions for getting the OAuth Client ID and OAuth Client Secret for the OAuth playground: https://developers.google.com/google-ads/api/docs/oauth/playground#get_a_client_id_and_client_secret

##### Authentication Via OAuth Playground (`OAUTH_REFRESH_TOKEN`)

Note: you may need to wait a few minutes for the Client ID and Client Secret to propagate before continuing.

**If your app is external, and in "testing mode", you will need to do go through these steps at least once a week while your study is online (preferably, more often).**

1. Go to OAuth Playground: https://developers.google.com/oauthplayground/
2. Click the gear wheel in the top right corner, and click "Use your own OAuth credentials". Paste in the Client ID and Client Secret from the last step.
3. Select "GMail API v1" and "Google Calendar API v3" from the API list, then click "Authorize APIs"
4. Click through the prompts to authorize using the study's Google account.
5. Click "Exchange authorization code for tokens," and copy the refresh token to `OAUTH_REFRESH_TOKEN` in the `functions/.env` file.

##### URLs (`EXP_SCREENING_URL`, `EXP_SESSION_URL`)

It is sometimes preferable to use separate URLs for your screening survey and your experimental sessions / consent form. You can set both of these here. They will be used in emails to participants, and they should both redirect to the Firebase project (see [this tutorial](https://firebase.google.com/docs/hosting/custom-domain) for how to redirect custom domain name to a Firebase project). If you're not sure what to put here, set both to the Google-assigned URL.

##### Google Calendars (`EXP_AVAILABILITY_CALENDAR`, `EXP_BOOKINGS_CALENDAR`)

The project uses two Google calendars to manage booking equipment pick-up/drop-off appointments. Both calendars should be owned by the study's Google account, though you can provide other accounts access to these calendars if you choose to do so. The Calendar ID to paste into the config file can be found in Google Calendar Settings, under "Integrate calendar" for each calendar.

The calendars serve different roles in the booking process:

1. `EXP_AVAILABILITY_CALENDAR`: each event on this calendar will be split into 15-minute timeslots for booking participants. Availability events should occur on Mondays (for pick-up appointments) and Fridays (for drop-off appointments).
2. `EXP_BOOKINGS_CALENDAR`: events on this calendar are created by the Firebase app automatically, when participants book appointment slots. Each event represents an appointment, and the title contains information about the appointment (the participant's numeric ID, their email address, and the type of appointment [pick-up/drop-off]).

##### Study Location (`EXP_LOCATION_NAME`, `EXP_LOCATION_URL`)

In order for participants to find the experimenter at appointments, it is important to give them instructions on where to go.

* `EXP_LOCATION_NAME`: the name of the location where the experimenter will meet participants for equipment pick-up/drop-offs. This phrase will be used when booking appointments and in emails to participants, in place of the blank in these sentences:
  * Both appointments will take place ___
  * The experimenter will meet you ___
* `EXP_LOCATION_URL`: a link to a map of the location. A Google maps link works well for this purpose.

##### Timing of Reminder Emails (`EXP_DAILY_EMAIL_TIME`, `EXP_TIMEZONE`)

Daily reminder emails (the COVID survey, a reminder to start the study) will be sent according to these parameters:

* `EXP_DAILY_EMAIL_TIME`: the time of day to send the reminder email, in hours (0-24)
* `EXP_TIMEZONE`: the timezone that this time should be calculated with respect to

##### Experimenter Dashboard Password (`EXP_DASHBOARD_PW`)

Your experimenter dashboard (which will be available at `your-url-here.com/experimenter`) will be password protected with the password you choose here.

#### 3. Spinning up a Local Dev Server for Testing [optional]

The dev server requires both a local emulation of Firebase and a build of the Vue frontend.

To start a local emulation of Firebase:

```
firebase emulators:start
```

To auto-compile the dev build of the Vue frontend:

```
npm run watch
```

To do both at the same time with a single command, first install [tmuxinator](https://github.com/tmuxinator/tmuxinator), then run:

```
npm run serve-firebase
```

This will create two tmux panes—one with your Firebase logs, and the other with the status of your Vue.js build.

Note that the emulator database is not persistent from session to session, so if you plan to use this mode to run a study offline, in a lab, you'll need to save the database to a separate JSON file between sessions! This method is not recommended, because of the high potential for data loss, but if you are dealing with especially sensitive information, it may be preferable.

#### 4. Deployment

To actually get your study online, first stop your Vue auto-builder (Ctrl+C in the Vue pane/window from the previous step) and run:

```
npm run deploy-all
```

This will build a production version of your site's frontend and upload your changes to Firebase.

### Running The Study

#### Participant Flow

While the experiment is online, participants will interact with the study like this:

1. Complete the screening survey on the homepage. This is the "entry point" into the entire study, and it is what should be advertised on your recruitment flyers.
2. Eligible participants will receive an email with a link to the consent form. This same link will be used to book pickup/dropoff appointments for study equipment as well. If the study is full, participants will be added to a mailing list.
3. The morning before each pickup appointment, participants will be asked to complete a COVID-19 screener via email.
4. At the pickup appointment, the experimenter will be able to confirm the pickup and send the Day 1 email to participants.
5. On each day of the study, participants will receive an email prompting them to complete the day's session.

#### Experimenter Functions

##### Setting Availability For Appointments

Experimenter availability can be set using Google calendar, by creating events on the `EXP_AVAILABILITY_CALENDAR` described above. Each event will be split into 15-minute appointment timeslots, and an equal number of timeslots should be available on Mondays and Fridays.

##### Using the Experimenter Dashboard

All scheduled appointments will appear on the `EXP_BOOKINGS_CALENDAR` as soon as they are booked, as well as on the experimenter dashboard, located at `your-study-url.com/experimenter`. The experimenter dashboard displays the participants' status in the "flow", their accrued earnings for completing sessions, and the results of their COVID screenings.

###### Morning Of Appointments (Reminder & COVID Screener)

On the morning of each appointment, participants will receive an invitation to complete a COVID-19 screening form via email. The result of this will appear on the experimenter dashboard. If a participant fails the screening, the appointment will automatically be cancelled, and the experimenter email account will receive an email with the results of the participants' responses to the screening survey. Participants will be reminded to respond again if they have not responded an hour before their appointment.

###### At The Appointment

At pick-up appointments, the experimenter has the opportunity to confirm pick-up and send the link to the first day's session, or to mark the participant as a no-show.

At drop-off appointments, the experimenter can confirm that equipment has been dropped off. This can help keep track of which participants have yet to return their equipment for following up.

###### Emailing Participants on the Waiting List

When new spots open up, experimenters can email participants who tried to sign up for the study while the study was full using the "bulk operations" tab.

## Limitatations

These experiments and the experimenter dashboard should work in the latest version of all browsers except Internet Explorer (which doesn't let you record audio without flash) or mobile phone browsers, because most (all?) smartphone operating systems don't let browsers record audio, for privacy reasons.

## Credit

* Many thanks to Chun Chan for help figuring out how to record audio using JavaScript, push it to the Firebase server, and display a volume meter during th esetup phase.
* Thanks to Matt Goldrick and the members of Soundlab for beta testing the experiment and providing helpful feedback on design!
