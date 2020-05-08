// Knuth shuffle (in-place)
// from: https://stackoverflow.com/a/2450976
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

var app = new Vue({
  el: '#app',
  data: {
    stream: {},
    snd: {},
    recorder: {},
    isStarted: false, // has the experiment started?
    isRecording: false, // are we currently recording?
    stimList: [{'twister': ''}], // list of stimuli for TT task
    currentStim: 0, // keep track of which stimulus should be shown
    isi: 1000, // interstimulus interval, in ms
    consentGiven: false,
    rejected: false, // declined to participate
    trialEnded: false, // TT task
    expOver: false,
    taskList: [ // tasks, in order
      {
        name: 'DDK',
        sample_path: './samples/pataka_online.m4a'
      },
      {
        name: 'TT',
        sample_path: './samples/TT.mp3'
      }
    ], // task info, in order of appearance
    currentTask: 0, // keeps track of which task is active
    recordingDDK: false, // whether DDK task is recording
		participant_id: null
  },
  created: function(){
		// getting participant ID from URL
		var urlParams = new URLSearchParams(window.location.search);
		this.participant_id = urlParams.get('PROLIFIC_PID');

    // get stimuli from CSV file
    fetch('./stimuli.csv')
      .then(response => response.text())
      .then(data => {
        this.stimList = Papa.parse(data, {
            'header': true
        }).data;

        // randomize stimulus list
        shuffle(this.stimList);

				//push stimulus list to Firebase
				var db = firebase.database();
				db.ref(this.participant_id + "/stimList").set(this.stimList);

      });
  },
  methods : {
		//get timestamp of consent
		storeConsent: function(){
      // update view
      this.consentGiven = true;

      // upload timestamp
			var db = firebase.database();
			db.ref(this.participant_id + "/consent").set(firebase.database.ServerValue.TIMESTAMP);
		},
    // function that starts the experiment
    startTask: function(){
      // get microphone permissions before anything else
      navigator.mediaDevices.getUserMedia({audio:true, video:false})
      	.then((stream) => {
      		this.stream = stream;

          // task-specific logic here
          if (this.taskList[this.currentTask].name == 'TT') {
            // update view to reflect that sound is playing
        		this.isStarted = true;
            // run first trial
            this.runTrial();
          } else if (this.taskList[this.currentTask].name == 'DDK') {
            // start recording
            this.record();

            // for DDK task we just need to record and then stop
            this.recordingDDK = true;
          }

        	}).catch((err) => {
            alert("In order to continue the experiment, you must allow this page to record audio using your microphone.")
          })


    },

    stopTask: function() {
      // stop recording
      this.stopRecording();

      // advance to next task
      this.currentTask += 1;

      // end the whole experiment if we're all out of tasks
      if (this.currentTask == this.taskList.length) {
        this.endExp();
      }
    },

    // function that advances to next trial
    nextTrial: function() {
      // begin start of next trial (hide continue button)
      this.trialEnded = false;

      // advance stimulus
      this.currentStim += 1;

      // trial flow
      this.runTrial();
    },

    // function that runs the trial
  	runTrial: function(){
      // import metronome sound (4 slow + 12 fast beats) as an object
  		this.snd = new Pizzicato.Sound(
  			{
  				source:'file',
  				options: {
  					path: './metronome.mp3',
  					loop: false
  				}
  			},

        // when sound is loaded...
  			() => {
          // set what to do after the sound ends
          this.snd.on("end", () => setTimeout(() => {
            this.stopRecording();

            // go to next item, if it exists
            if (this.currentStim < this.stimList.length - 2) {

              // show continue button
              this.trialEnded = true;
            } else {
              this.stopTask();
            }
          }, this.isi));

          // actually play the sound, but after a 1s pause
          setTimeout(() => {
            this.snd.play();
          }, this.isi);
        }
  		);

      // start recording
  		this.record();
  	},

    // record the audio
  	record: function(){
  		var AudioContext = window.AudioContext || window.webkitAudioContext;
  		var audio_context = new AudioContext();
  		var input = audio_context.createMediaStreamSource(this.stream);
  		this.recorder = new Recorder(input, {numChannels:1});
      this.isRecording = true;
  		this.recorder.record();
  	},

    // stop recording and upload
    stopRecording: function() {
      this.recorder.stop();
      this.isRecording = false;
      // compute filename here
      var filename = this.taskList[this.currentTask].name + "-" + this.currentStim

      // upload recording here
			this.recorder.exportWAV((blob) => {
				var storage = firebase.storage();

				//this line pushes the wave file (blob) up to Firebase
				storage.ref().child(this.participant_id + "/" + filename + ".wav").put(blob);
			});

      this.recorder.clear();

    },

    // play sample trial
    sampleTrial: function() {
      var sampleSound = new Pizzicato.Sound(
  			{
  				source:'file',
  				options: {
  					path: this.taskList[this.currentTask].sample_path,
  					loop: false
  				}
  			},

        // when sound is loaded, just play it
  			() => {
          sampleSound.play();
        }
  		);
    },

    endExp: function() {
      // update view
      this.expOver = true;
    }
  }
})
