var app = new Vue({
  el: '#app',
  data: {
    stream: {},
    snd: {},
    recorder: {},
    isPlaying: false,
    stimList: [{'twister': ''}],
    currentStim: 0
  },
  created: function(){
    // get stimuli from CSV file
    fetch('./stimuli.csv')
      .then(response => response.text())
      .then(data => {this.stimList = Papa.parse(data, {
        'header': true
      }).data});

    // hook up microphone
  	navigator.mediaDevices.getUserMedia({audio:true, video:false})
  	.then((stream) => {
  		this.stream = stream;
  	})
  },
  methods : {
  	playSound: function(){
      // import metronome sound as an object
  		this.snd = new Pizzicato.Sound(
  			{
  				source:'file',
  				options: {
  					path: './metronome.wav',
  					loop: true
  				}
  			},

        // play metronome sound
  			() => this.snd.play()
  		);

      // update view to reflect that sound is playing
  		this.isPlaying = true;

      // start recording
  		this.record();
  	},
  	record: function(){
  		var AudioContext = window.AudioContext || window.webkitAudioContext;
  		var audio_context = new AudioContext();
  		var input = audio_context.createMediaStreamSource(this.stream);
  		this.recorder = new Recorder(input, {numChannels:1});
  		this.recorder.record();
  	},
  	stop: function(){

      // stop playing the sound
	  	this.snd.stop();

      // stop the recorder
  		this.recorder.stop();

      // export to WAV file (locally; prompt for location)
  		// this.recorder.exportWAV((blob) => saveAs(blob, "recording.wav"));

      // update view as a result of this variable
  		this.isPlaying = false;

      // go to next twister
      this.currentStim += 1;
  	}
  }

})
