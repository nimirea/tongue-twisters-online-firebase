var app = new Vue({
  el: '#app',
  data: {
    stream: {},
    snd: {},
    recorder: {},
    isPlaying: false
  },
  created: function(){
  	navigator.mediaDevices.getUserMedia({audio:true, video:false})
	.then((stream) => {
		this.stream = stream;
	})
  },
  methods : {
  	playSound: function(){         	
		this.snd = new Pizzicato.Sound(
			{
				source:'file', 
				options: {
					path: './metronome.wav',
					loop: true
				}
			},
			() => this.snd.play()
		);
		this.isPlaying = true;
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
	  	this.snd.stop();
		this.recorder.stop();
		this.recorder.exportWAV((blob) => saveAs(blob, "recording.wav"));
		this.isPlaying = false;
  	}
  }

})