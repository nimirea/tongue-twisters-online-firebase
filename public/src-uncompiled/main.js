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

// Initialize Cloud Functions through Firebase
var functions = firebase.functions();

Vue.component('number-input-validated', {
  props: {
    before: String,
    after: String,
    maxVal: {
      type: Number,
      default: 24
    },
    minVal: {
      type: Number,
      default: 0
    },
    value: null,
    inputId: String
  },
  data: function() {
    return({
      attempted: false,
      resultNumber: null
    })
  },
  created: function() {
    this.$emit('error-catch',
      {
        'element_name': this.inputId,
        'num_errors': this.errorList.length
      });
  },
  computed: {
    errorList: function() {
      var result = [];

      // type error
      if (isNaN(this.resultNumber) || this.resultNumber === '' || this.resultNumber === null) {
        result.push("must be a number");
      }

      // value errors
      else if (this.resultNumber < this.minVal) {
        result.push("too low");
      }
      else if (this.resultNumber > this.maxVal) {
        result.push("too high");
      }

      return result;
    },
    hasErrors: function() {
      result = this.errorList.length > 0;
      return result;
    }
  },
  methods: {
    updateAppState: function(val) {
      this.resultNumber = val;

      this.$emit('input', this.resultNumber);


      this.$emit('error-catch',
        {
          'element_name': this.inputId,
          'num_errors': this.errorList.length
        });
    }
  },
  template: `<p>{{ before }}
    <input class="short-input"
      v-bind:value="value"
      v-on:input="attempted = true; updateAppState($event.target.value);"
    /> {{after}}

    <ul v-if="errorList.length > 0 && attempted === true" class="survey-error">
      <li v-for="errorMessage in errorList" class="survey-error">{{ errorMessage }}</li>
    </ul>

  </p>`
})

Vue.component('time-input-validated', {
  props: {
    before: String,
    value: null,
    superla: String,
    good: String,
    before: String,
    inputId: String
  },
  data: function() {
    return {
      hours: null,
      mins: null,
      ampm: '',
      attempted: false,
      unselected: false
    }
  },
  created: function() {
    this.$emit('error-catch',
      {
        'element_name': this.inputId,
        'num_errors': this.errorList.length
      });
    },
  computed: {
    errorList: function() {
      var result = [];

      // type error
      if (isNaN(this.hours) || this.hours === '' || isNaN(this.mins)) {
        result.push("hours and minutes must be numbers");
      }

      // value errors
      if (this.hours === null) {
        result.push("please enter an hour")
      } else if (!isNaN(this.hours) && (this.hours < 1 || this.hours > 12)) {
        result.push("invalid hour");
      }

      if (this.mins < 0 || this.mins >= 60) {
        result.push("invalid minutes");
      }

      if (this.unselected === true && this.ampm == '') {
        result.push("please select am or pm")
      }

      return result;
    },
    completeTime: function () {



      return String(this.hours) + ":"
              + (this.mins === null || this.mins === "0" ? "00" : String(this.hours))
              + " "
              + this.ampm;
    }
  },
  methods: {
    updateAppState: function() {
      this.attempted = true;
      this.$emit('input', this.completeTime);
      this.$emit('error-catch', {
        'element_name': this.inputId,
        'num_errors': this.errorList.length
      });
    },
    setUnselected: function(unselectedValue) {
      this.unselected = unselectedValue;
    }
  },
  filters: {
    uppercase: function (value) {
      if (!value)
        return '';

      value = value.toString();

      return value.toUpperCase();
    }
  },
  template: `<p>
  <span v-if="good == 'night'">On the night b</span><span v-else>B</span>efore a {{ before }},
  <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  what is your <b>{{ superla }}</b> GOOD {{ good | uppercase }} TIME ?
    <input type="number" class="short-input"
      v-bind:value="hours"
      v-on:input="hours = $event.target.value; updateAppState();"
      v-on:blur="setUnselected(true);"
      v-on:focus="setUnselected(false);"
    /> : <input type="number" class="short-input"
      v-bind:value="mins"
      v-on:input="mins = $event.target.value; updateAppState();"
      v-on:focus="setUnselected(false);"
      v-on:blur="setUnselected(true);"
    />

    <select
      v-bind:value="ampm"
      v-on:change="ampm = $event.target.value; updateAppState();"
      v-on:focus="setUnselected(false);"
      v-on:blur="setUnselected(true);"
    >
      <option disabled value="">please select one</option>
      <option>am</option>
      <option>pm</option>
    </select>

    <ul v-if="errorList.length > 0 && attempted === true" class="survey-error">
      <li v-for="errorMessage in errorList" class="survey-error">{{ errorMessage }}</li>
    </ul>

  </p>`
})

Vue.component('radio-button', {
  props: ['name', 'label', 'value'],
  template: `
  <span>
      <input type="radio" :value="label" :name="name" v-model="radioButtonValue" :id="name + value | regularize">
      <label v-bind:for="name + value | regularize">{{label}}</label><br/>
  </span>
  `,
  computed: {
    radioButtonValue: {
      get: function() {
          return this.value
      },
      set: function() {
          // Communicate the change to parent component so that selectedValue can be updated
          this.$emit("change", this.label)
      }
    }
  }
})

Vue.component('radio-button-question', {
  props: {
    value: null,
    groupId: null,
    options: {
      type: Array,
      default: function () {
        return ['0-15 mins.',
                '16-30 mins.',
                '31-45 mins.',
                '46-60 mins.',
                '61-75 mins.',
                '76-90 mins.',
                '91-105 mins.',
                '106-120 mins.',
                '2-3 hours',
                '3-4 hours',
                'over 4 hours'
              ]
        }
      },
    teststr: {
      type: String,
      default: "this is a test"
    }
  },
  data: function() {
    return {
      selectedValue: null
    };
  },
  filters: {
    regularize: function (value) {
      value = value.replace(" ", "");
      value = value.replace(".", "");

      return (value)

    }
  },
  methods: {
    updateAppState: function(newValue) {
      this.selectedValue = newValue;
      this.$emit('input', this.selectedValue);
      this.$emit('error-catch', {
        'element_name': this.groupId,
        'num_errors': this.selectedValue === null ? 1 : 0
      });
    }
  },
  computed: {
    getVal: function() {
      return(this.value);
    }
  },
  template: `
  <div>
    <radio-button v-for="option in options"
      v-bind:name="groupId"
      v-bind:label="option"
      v-bind:value="option | regularize"
      v-on:change="updateAppState"
    ></radio-button>
  </div>
  `
})

var app = new Vue({
  el: '#app',
  data: {
    stream: {},
    snd: {}, // sound to be played
    recorder: {},
    analyserNode: {}, // volume meter
    soundbar: { // parameters for bar that displays while sound is playing
      'color': 'blue',
      'width': 0,
      'text': 'just right',
      cutoffs: {
        low: 35,
        high: 92
      }
    },
    isStarted: false, // has the experiment started?
    isRecording: false, // are we currently recording?
    stimList: [{'twister': ''}], // list of stimuli for TT task
    currentStim: 0, // keep track of which stimulus should be shown
    isi: 1000, // interstimulus interval, in ms
    stimVisible: false,
    sampleTrialPlaying: false,
    consentGiven: false,
    rejected: false, // declined to participate
    trialEnded: false, // TT task
    expOver: false,
    numerals: [ // used for language in the consent form
      'first',
      'second',
      'third',
      'fourth'
    ],
    compensation: [
      14,
      18,
      22,
      26
    ],
    taskList: [ // tasks, in order
      {
        name: 'mic_check',
        data: {
          headphoneType: null,
          headphoneMic: null,
          micType: null,
          inputStatus: null,
          setupConfirm: null
        }
      },
      {
        name: 'TT',
        sample_path: './samples/TT.mp3'
      },
      {
        name: 'survey'
      }
    ], // task info, in order of appearance
    currentTask: 0, // keeps track of which task is active
    recordingDDK: false, // whether DDK task is recording
		participant_id: null,
    exp_cond: null, // experiment condition
    cb_cond: null, // counterbalancing condition
    surveySubmitted: false, // whether ending survey has been submitted or not
    surveyData: { }, // data for the survey at the end
    stq: { }, // sleep timing questionnaire
    perfectFormState: false, // checking whether the survey is valid
    errorCounts: { }, // for storing errors for each input
    audioPermission: { // data for the survey at the beginning
      'presentation': false,
      'public': false
    },
    test_mode: null, // whether to use a smaller stimulus list ('yes' = use smaller)
    timeRemainingString: null,
    minsRemaining: null,
    timingCorrect: null, // whether the timing is correct or not (set based on minsRemaining, possible values are early, just right)
    prevDayIncomplete: false, // did the participant complete the previous day?
    alreadyDone: false, // did the participant already complete THIS day?
    browserOutdated: false,
    completionURL: null,
    completionErrors: false
  },
  methods : {
		//get timestamp of consent & upload sequence data to database
		storeConsent: function(){
      // update view
      this.consentGiven = true;

      // set participant ID automatically if not provided
      var spi = firebase.functions().httpsCallable('setParticipantId');
      spi(this.participant_id)
      .then((res) => {

        this.participant_id = res.data;

        var db = firebase.database();
        // upload consent timestamp
        db.ref(this.participant_id + "/consent/" + this.day).set(firebase.database.ServerValue.TIMESTAMP);

        // upload audio permissions
        db.ref(this.participant_id + "/audioPermission/" + this.day).set(this.audioPermission);

        // upload conditions (experimental & counterbalancing)
        db.ref(this.participant_id + '/expCond').set(this.exp_cond);
        db.ref(this.participant_id + '/cbCond').set(this.cb_cond);

        // upload stimList
        db.ref(this.participant_id + "/stimList/" + this.day).set(this.stimList);

      });
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
          } else if (this.taskList[this.currentTask].name == 'mic_check') {
            this.record();
          }

        	}).catch((err) => {
            alert("In order to continue the experiment, you must allow this page to record audio using your microphone.")
          })


    },

    // stop task and continue to next one (or end the experiment, if we're all out of tasks)
    stopTask: function() {
      // stop recording, if it's going
      if (this.isRecording === true) {
        this.stopRecording();
      }



      // end the whole experiment if we're all out of tasks
      if (this.currentTask == this.taskList.length - 1) {
        // initialized callable function
        var cc = firebase.functions().httpsCallable('checkCompletion');

        cc({
            participant_id: this.participant_id,
            day: this.day
          })
        .then((res) =>
          {
            res = res.data;
            if (res.is_incomplete === 0) {

              this.completionURL = res.message;

              // push 'completed' tag up to server
              var db = firebase.database();
              db.ref(this.participant_id + "/lastDayCompleted").set(this.day)
              .then(() => {
                this.updateTimeRemaining(this.day, () => {
                  this.expOver = true; // update view
                });
              })

            } else {
              this.completionErrors = res.message;

              // reset the experiment!
              this.consentGiven = false;
              this.currentTask = 0;
            }
          });

      } else {
        // advance to next task
        this.currentTask += 1;

        // scroll to top
        window.scrollTo(0, 0);
      }
    },

    updateFormErrors: function(namedErrors) {
      // store data
      this.errorCounts[namedErrors['element_name']] = namedErrors['num_errors']

      // set perfectFormState based on this
      var errorSum = Object.values(this.errorCounts).reduce((a,b) => a + b);
      this.perfectFormState = (errorSum === 0 &&
        (Object.keys(this.stq).length === 18 || this.day > 1)
      );
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
            if (this.currentStim < this.stimList.length - 1) {

              // show continue button
              this.trialEnded = true;

              // hide stimulus in next trial
              this.stimVisible = false;

            } else {
              this.stopTask();
            }
          }, this.isi));

          setTimeout(() => {
            this.stimVisible = true;
          }, this.isi );

          this.snd.play();

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

      // update view
      this.isRecording = true;

      // start updating the soundbar if we're on the mic-check
      if (this.taskList[this.currentTask].name == "mic_check") {
        this.analyserNode = audio_context.createAnalyser();
        this.analyserNode.fftSize = 2048;
        input.connect(this.analyserNode);
        this.updateAnalysers();
      }

      // actually start recording
  		this.recorder.record();
  	},

    // update soundbar width based on volume
    updateAnalysers: function() {
      if (this.isRecording) {
    	   requestAnimationFrame(this.updateAnalysers);
       }

			const freqByteData = new Uint8Array(this.analyserNode.frequencyBinCount);
			this.analyserNode.getByteFrequencyData(freqByteData);

      const data = new Array(255);
      let lastNonZero = 0;
      let datum;

      for (let idx = 0; idx < 255; idx += 1) {
        datum = Math.floor(freqByteData[idx]) - (Math.floor(freqByteData[idx]) % 5);

        if (datum !== 0) {
          lastNonZero = idx;
        }

        data[idx] = datum;
      }

			//average values in data array (range: 1-100)
			var values = 0;
			for (var i = 0; i < data.length; i++) {
				values += data[i];
			}
			this.soundbar.width = (values / data.length) / 1.5; // adding in this factor makes it smoother

      if (this.soundbar.width < this.soundbar.cutoffs.low) {
        this.soundbar.message = "too soft, move microphone closer (or start speaking)";
        this.soundbar.color = "red";
      } else if (this.soundbar.width > this.soundbar.cutoffs.high) {
        this.soundbar.message = "too loud, move microphone farther away";
        this.soundbar.color = "red";
      } else {
        this.soundbar.message = "just right!";
        this.soundbar.color = "blue";
      }
  	},

    // stop recording and play back
    playbackTest: function() {
      this.recorder.stop();
      this.recorder.exportWAV((blob) => {
        let dataURI = URL.createObjectURL(blob);
        let testSound = new Pizzicato.Sound(
    			{
    				source:'file',
    				options: {
    					path: dataURI,
    					loop: false
    				}
    			},

          // when sound is loaded, just play it
    			() => {
            testSound.play();
          }
    		);
      });
    },

    // stop recording and upload
    stopRecording: function() {
      this.recorder.stop();
      this.isRecording = false;

      // compute filename here
      var filename = this.taskList[this.currentTask].name + "-" + this.currentStim

      // upload recording here
      if (this.taskList[this.currentTask].name !== 'mic_check') {
  			this.recorder.exportWAV((blob) => {
  				var storage = firebase.storage();

  				//this line pushes the wave file (blob) up to Firebase
  				storage.ref().child(this.participant_id + "/" + this.day + "/" + filename + ".wav").put(blob);
  			});
      }
      this.recorder.clear();

    },

    // play sample trial
    sampleTrial: function() {
      if (!this.sampleTrialPlaying) {
        var sampleSound = new Pizzicato.Sound(
    			{
    				source:'file',
    				options: {
    					path: this.taskList[this.currentTask].sample_path,
    					loop: false
    				}

    			},

          // when sound is loaded, go through the trial flow
    			() => {
            // reset the frame when the sound ends
            sampleSound.on("end", () => {
              this.stimVisible = false;
              this.sampleTrialPlaying = false;
            })

            this.sampleTrialPlaying = true;

            setTimeout(() => {
              this.stimVisible = true;
            }, this.isi);
            
            sampleSound.play();

          }
    		);
      }
    },

    // push survey data and end the survey
    submitSurvey: function() {
      // upload surveyData
      var db = firebase.database();

      // push stq if this is day 1
      if (this.day === 1) {
        db.ref(this.participant_id + "/stq").set(this.stq)
      }

      db.ref(this.participant_id + "/surveyData/" + this.day).set(this.surveyData)
      .then(() => {
        // update view
        this.stopTask();
      });


    },

    // calculate time remaining (update timeRemainingString and minsRemaining)
    // d = previous day
    // usually, you will want to do something with timeRemainingString / minsRemaining afterwards, so we have a callback
    updateTimeRemaining: function(d, _callback = () => { return null }) {

      var gct = firebase.functions().httpsCallable('getConsentTime');
      gct({
        participant_id: this.participant_id,
        day: d
      })
      .then((res) => {

        var lastTimestamp = res.data;

        if (lastTimestamp === null) {
          this.minsRemaining = 0
        } else {
          this.minsRemaining = 1440 - Math.floor((new Date().getTime() - lastTimestamp)/(1000*60));
        }

        var roundedHours = Math.floor(this.minsRemaining / 60)

        this.timeRemainingString = roundedHours + " hours";

        if (roundedHours * 60 < this.minsRemaining) {
          this.timeRemainingString = this.timeRemainingString + " and " + (this.minsRemaining - roundedHours * 60) + " minutes";
        }

      }).then(() => {
        _callback();
      });
    }


  },
  created: function(){
    // check if user is using IE
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
      this.browserOutdated = true;
    }

    if (this.browserOutdated === false) {

      // getting participant ID from URL
      var urlParams = new URLSearchParams(window.location.search);
      this.participant_id = urlParams.get('PROLIFIC_PID');
      this.test_mode = (urlParams.get('TEST_MODE') === 'yes');
      this.clockPosition = urlParams.get('clock_position');
      this.day = Number(urlParams.get('day'));

      // determine whether participant has arrived at the right time,
      // based on whether they've
      var ccs = firebase.functions().httpsCallable('calcCompletionStatus');
      ccs({
        'participant_id': this.participant_id,
        'day': this.day
      }).then((res) => {
        this.prevDayIncomplete = res.data.prevDayIncomplete;
        this.alreadyDone = res.data.alreadyDone;

        if (this.alreadyDone === false) {
          if (this.day != 1) {

            this.updateTimeRemaining(this.day - 1, () => {

              // update timingCorrect dynamically
              if (this.minsRemaining > 0) {
                this.timingCorrect = "early";
              } else {
                this.timingCorrect = "just right";
              }

            });

          } else {
            this.timingCorrect = "just right";
          }
        }

      })

      // set experimental & counterbalancing conditions
      var gpc = firebase.functions().httpsCallable('getParticipantConds');
      gpc(this.participant_id).then((res) => {

          this.exp_cond = res.data.exp_cond;
          this.cb_cond = res.data.cb_cond;

          // get stimuli from CSV file
          var stim_file = './stimuli.csv'
          if (this.test_mode) {
            stim_file = './stimuli-small.csv';
          }

          fetch(stim_file)
            .then(response => response.text())
            .then(data => {
              this.stimList = Papa.parse(data, {
                  'header': true,
                  'skipEmptyLines': true,
                  'columns': ['stim_id', 'cb_cond', 'exp_cond', 'exp_idx', 'twister']
              }).data;

              // filter by day and conditions
              this.stimList = this.stimList.filter(item => {

                var right_day = true;

                if (this.day <= 2) {
                  right_day = (item.exp_idx == "1");
                } else {
                  right_day = (item.exp_idx == "2");
                }

                return (right_day
                        && item.exp_cond == this.exp_cond
                        && item.cb_cond == this.cb_cond)

              });

              // randomize stimulus list
              shuffle(this.stimList);

              if (this.day % 2 === 1) {
                // Day 1 & 3: pick half at random
                this.stimList = this.stimList.slice(0, this.stimList.length / 2)

              } else {

                // Day 2 & 4: pick whichever words weren't already picked yesterday
                var gs = firebase.functions().httpsCallable('getStims');
                gs({
                  participant_id: this.participant_id,
                  day: this.day - 1
                }).then((res) => {
                  let prev_stim_ids = res.data;

                  if (prev_stim_ids === null) {
                    console.log("Sorry! Not enough data to create stimulus list.");
                    this.stimList = null;
                  } else {
                    this.stimList = this.stimList.filter(item => {
                        return !(prev_stim_ids.includes(item.stim_id));
                      });
                  }

                });

              }

            });

        });
    }
  }
})
