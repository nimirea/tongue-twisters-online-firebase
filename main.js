// config variables

var app = new Vue({
  el: '#app',
  data: {
    stream: {},
    snd: {},
    recorder: {},
    isStarted: false,
    stimList: [{'twister': ''}], // list of stimuli for TT task
    currentStim: 0,
    isi: 1000, // interstimulus interval, in ms
    consentGiven: false,
    rejected: false, // declined to participate
    trialEnded: false, // TT task
    expOver: false,
    taskList: ['DDK', 'TT'], // list of tasks, in order of appearance
    currentTask: 0, // keeps track of which task is active
    recordingDDK: false // whether DDK task is recording
  },
  created: function(){
    // get stimuli from CSV file
    fetch('./stimuli.csv')
      .then(response => response.text())
      .then(data => {this.stimList = Papa.parse(data, {
        'header': true
      }).data});
  },
  methods : {
    // function that starts the experiment
    startTask: function(){
      // get microphone permissions before anything else
      navigator.mediaDevices.getUserMedia({audio:true, video:false})
      	.then((stream) => {
      		this.stream = stream;

          // task-specific logic here
          if (this.taskList[this.currentTask] == 'TT') {
            // update view to reflect that sound is playing
        		this.isStarted = true;
            // run first trial
            this.runTrial();
          } else if (this.taskList[this.currentTask] == 'DDK') {
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
  		this.recorder.record();
      console.log("Recorder started")
  	},

    // stop recording and upload
    stopRecording: function() {
      // TODO check if recorder is actually playing.
      console.log("Recorder stopped")
      this.recorder.stop();

      // TODO upload recording here
      // export to WAV file (locally; prompt for location)
      // this.recorder.exportWAV((blob) => saveAs(blob, "recording.wav"));

    },

    // TODO play sample trial
    sampleTrial: function() {

    },

    endExp: function() {
      // update view
      this.expOver = true;
    }
  }
})
