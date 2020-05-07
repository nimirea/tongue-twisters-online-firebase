// config variables

var app = new Vue({
  el: '#app',
  data: {
    stream: {},
    snd: {},
    recorder: {},
    isStarted: false,
    stimList: [{'twister': ''}],
    currentStim: 0,
    isi: 1000, // interstimulus interval, in ms
    consentGiven: false,
    rejected: false,
    trialEnded: false,
    expOver: false,
    taskOrder: ['DDK', 'TT'],
    currentTask: 0
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
    startExp: function(){
      // get microphone permissions before anything else
      navigator.mediaDevices.getUserMedia({audio:true, video:false})
      	.then((stream) => {
      		this.stream = stream;

          // update view to reflect that sound is playing
      		this.isStarted = true;

          // run first trial
          this.runTrial();

      	}).catch((err) => {
          alert("In order to continue the experiment, you must allow this page to record audio using your microphone.")
        })


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
            this.recorder.stop();
            // TODO upload recording here
            // export to WAV file (locally; prompt for location)
            // this.recorder.exportWAV((blob) => saveAs(blob, "recording.wav"));

            // go to next item, if it exists
            if (this.currentStim < this.stimList.length - 2) {
              // show continue button
              this.trialEnded = true;
            } else {
              this.endExp();
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
