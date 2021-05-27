<template>
  <loading-view v-if="uploading === true"></loading-view>
  <div v-else>
    <h1>Consent to Participate in Research<span v-if="record === true"><br/>(signed {{given_data.consent | parseDate }})</span></h1>

    <h2>Title of Research Study: <span class="italic">Tongue-Twisters Across Multiple Days</span></h2>

    <h2>Principal Investigator:
    <span class="italic">Matthew Goldrick</span></h2>

    <h2>Student Investigator:
    <span class="italic">Nicole Mirea</span></h2>

    <h2>Supported By:
    <span class="normal-weight">This research is supported by the Northwestern University Department of Linguistics.</span></h2>

    <h2>Key Information about this research study:</h2>

    <p>The following is a short summary of this study to help you decide whether to be a part of this study. Information that is more detailed is explained later on in this form.</p>
    <ul>
      <li>The purpose of this study is to learn more about how people learn to speak words and phrases in a new language.</li>
      <li>This research study will take place across <b>{{ compensation.length }} days</b> with a 30 minute experimental session on each day.</li>
      <li>You will be asked to read some tongue-twisters aloud while recording yourself during each experimental session, and to wear an activity tracker on your wrist during each night of the study.</li>
      <li>The primary potential risk of participation is frustration with the tongue-twister task; to counteract this, you will be able to take breaks during experimental sessions.</li>
      <li>The main benefit of being in this study is helping scientists better understand language learning.</li>
    </ul>

    <h2>Why am I being asked to take part in this research study?</h2>
    <p>We are asking you to take part in this research study because you have responded to our screening survey indicating that you are an adult native English speaker with no history of speech, hearing, language, or sleep disorder. In addition, you indicated that you own the equipment necessary to complete the tongue-twister task, and that you would be willing to log into the study at the same time for {{ compensation.length }} days in a row.</p>

    <h2>How many people will be in this study?</h2>
    <p>We expect about 78 people will be in this research study.</p>

    <h2>What should I know about participating in a research study?</h2>

    <ul>
      <li>Someone will explain the research study to you.</li>
      <li>Whether or not you take part is up to you.</li>
      <li>You can choose not to take part.</li>
      <li>You can agree to take part and later change your mind.</li>
      <li>Your decision will not be held against you.</li>
      <li>You can ask all the questions you want before you decide.</li>
      <li>You do not have to answer any question you do not want to answer.</li>
    </ul>

    <h2>What happens if I say, "Yes, I want to be in this research"?</h2>

    <p>You will be asked to select when you are available to pick up and drop off the Fitbit activity tracker that you will be asked to wear on your wrist during each night of the study. You will also be asked a few demographic questions that will allow us to collect more accurate sleep data—these are completely optional, and you will be compensated even if you decline to answer some or all of these demographic questions.</p>
    <p>At the pick-up appointment, which should take no longer than 5 minutes, the experimenter will give you a Fitbit wearable activity tracker. They will also email you a link to the first session of the experiment.</p>
    <p>You will be asked to complete this first session on your own computer on the day that you pick up the activity tracker, so that you can complete all sessions before returning the activity tracker. These sessions should be spaced exactly 24 hours apart, and each session will take approximately 30 minutes to complete.</p>

    <p>Each session will have 3 parts:</p>
    <ol>
      <li>You will first be asked to test out your microphone, to make sure that it is close enough for us to record clear speech.</li>
      <li>Then, you will be asked to put on headphones and read tongue-twisters for about 24 minutes. We will be recording audio during this part of the experiment; <b>allowing us to record audio is mandatory for participating in this research</b>, since we are studying spoken language.</li>
      <li>Finally, you will be asked to complete a post-task survey about your equipment and your sleep habits.</li>
    </ol>
    <p>After completing the post-task survey on each day, you will be asked to complete the next day’s session of this study 24 hours later, after a full night of sleep, during which you should wear the activity tracker. The next day’s session link will be emailed to you after you have completed the previous day’s session, but before 24 hours have elapsed.</p>

    <h2>Will being in this study help me in any way?</h2>
    <p>We cannot promise any benefits to you or others from your taking part in this research. However, possible benefits include contributing to science that can help create better language-learning tools.</p>

    <h2>Is there any way being in this study could be bad for me?</h2>

    <p>You may experience boredom and/or frustration during the tongue-twister task, which is quite difficult. You will have the opportunity to take breaks during the study in order to help with this.</p>
    <p>A possible risk for any research is that confidentiality could be compromised – that is, that people outside the study might get hold of confidential study information.  We will do everything we can to minimize this risk, as described in more detail later in this form.</p>

    <h2>What happens if I do not want to be in this research, or I change my mind later?</h2>
    <p>Participation in research is voluntary. You can decide to participate or not to participate.  If you do not want to be in this study or withdraw from the study at any point, your decision will not affect your relationship with Northwestern University/Northwestern Memorial Healthcare.</p>
    <p>You can leave the research at any time and it will not be held against you.</p>
    <p>If you decide to withdraw from this study, the researchers will ask you if information already collected from you can be used.</p>

    <h2>How will the researchers protect my information?</h2>
    <p>After data collection is finished, your email address and participant ID will be stripped from your survey answers, recordings, and sleep data, and replaced with a random number. The mapping between your email address, your participant ID, and this random number, as well as your recordings, survey answers, and sleep data will be stored and backed up on a secure server that only project personnel, the IRB staff, and any other individual required by law will be authorized to access. The Fitbit account associated with your sleep data will not be linked to your email address, and will be deleted after data collection is complete.</p>

    <h2>Who will have access to the information collected during this research study?</h2>
    <p>Efforts will be made to limit the use and disclosure of your personal information, including research study records, to people who have a need to review this information. We cannot promise complete secrecy.</p>
    <p>There are reasons why information about you may be used or seen by other people beyond the research team during or after this study. Examples include:</p>

    <ul>
      <li>University officials, government officials, study funders, auditors, and the Institutional Review Board may need access to the study information to make sure the study is done in a safe and appropriate manner.</li>
      <li>The research team may give information to appropriate authorities for reasons of health and safety – for example, if you indicate that you plan to harm yourself or others, or for public health reasons.</li>
      <li>We will not ask you about child abuse, but if you tell us about child abuse or neglect, we may be required or permitted by law or policy to report to authorities.</li>
    </ul>

    <h2>How might the information collected in this study be shared in the future?</h2>
    <p>We will keep the information we collect about you during this research study for study recordkeeping. Your recordings, email address, and other information that can directly identify you will be stored securely and separately from the rest of the research information we collect from you.</p>
    <p>De-identified data from this study may be shared with the research community, with journals in which study results are published, and with databases and data repositories used for research. We will remove or code any personal information that could directly identify you before the study data are shared. Despite these measures, we cannot guarantee anonymity of your personal data.</p>
    <p>We would like to share your audio recordings with the general public and other researchers for future research studies.  We will ask for your consent to do so at the end of this form.  You can be in this current research study without agreeing to future research use of your audio recordings.</p>
    <p>The results of this study could be shared in articles and presentations, but will not include any information that identifies you unless you give permission for use of information that identifies you in articles and presentations.</p>

    <h2>Will I be paid or given anything for taking part in this study?</h2>
    <p>You will receive up to ${{ compensation.reduce((a, b) => a + b, 0) }} for your participation in this study, distributed upon return of the activity tracker. You will still receive compensation for your time even if you choose to withdraw before completing the entire {{ compensation.length }}-day study:</p>

    <ul>
      <li v-for="(item, index) in compensation" :key="item">
        You will receive<span v-if="index > 0"> an additional</span> ${{ item }} for completing completing Day {{ index + 1 }}'s session.
      </li>
    </ul>

    <p>In addition, you will receive reimbursement for transportation, parking, or other expenses you may incur when picking up and returning the activity monitors.</p>

    <h2>Who can I talk to?</h2>
    <p>If you have questions, concerns, or complaints, you can contact Principal Investigator Matt Goldrick (<a href="mailto:matt-goldrick@northwestern.edu">matt-goldrick@northwestern.edu</a>) and Nicole Mirea (<a href="mailto:nimirea@u.northwestern.edu">nimirea@u.northwestern.edu</a>).</p>
    <p>This research has been reviewed and approved by an Institutional Review Board ("IRB") – an IRB is a committee that protects the rights of people who participate in research studies. You may contact the IRB by phone at (312) 503-9338 or by email at <a href="mailto:irb@northwestern.edu">irb@northwestern.edu</a> if:</p>

    <ul>
      <li>Your questions, concerns, or complaints are not being answered by the research team.</li>
      <li>You cannot reach the research team.</li>
      <li>You want to talk to someone besides the research team.</li>
      <li>You have questions about your rights as a research participant.</li>
      <li>You want to get information or provide input about this research.</li>
    </ul>

    <h2>Optional Elements:</h2>
    <p>The following research activities are optional, meaning that you do not have to agree to them in order to participate in the research study. Please indicate your willingness to participate in these optional activities by checking the box next to each activity.</p>

    <checkbox-question
      group-id="permissions"
      v-model="permissions"
      :options="[
        'The researchers may use audio recordings of me in scholarly presentations or publications when hearing my voice might serve to help others understand the research.',
        'I give permission for the recordings of my voice to be included in a database that is available to the general public.'
      ]"
      :alreadyChecked = "given_data.permissions"
      :unclickable = "record === true"
    ></checkbox-question>

    <div v-if="record === false">
      <p>If you want a copy of this consent for your records, you can print it from the screen. A copy of this consent form will be automatically emailed to you if you choose to participate.</p>
      <p>If you wish to participate, please click the “I Agree” button and you will be taken to the microphone test.</p>
      <p>If you do not wish to participate in this study, please select “I Disagree” or select X in the corner of your browser.</p>

      <div class = "buttonbox">
        <button v-on:click="storeConsent" class="green">I agree</button>
        <button v-on:click="rejected = true;" class="red">I disagree</button>
      </div>

    </div>
    <p v-else>Our records show that you signed this consent document on {{ given_data.consent | parseDate }} (Chicago time). If you would like to save a copy of this document for your own records, please print it from your screen at this time.</p>
  </div>
</template>
<script>

import { fb_functions } from "../fb_init.js"
import checkboxQuestion from './form_parts/checkbox-question.vue'
import loadingView from './loading-view.vue'

export default {
  name: 'consent-form',
  props: ['pptId', 'record'],
  components: {
    checkboxQuestion,
    loadingView
  },
  data: function() {
    return {
      permissions: [],
      compensation: [],
      given_data: {},
      uploading: false
    }
  },
  methods: {
    uploadData: fb_functions.httpsCallable('uploadData'),
    storeConsent: function() {
      this.uploading = true;
      let self = this;

      return this.uploadData({
        'participant_id': this.pptId,
        'consent': 'now',
        'permissions': this.permissions,
        'state': "appointment-booking"
      }).then((new_ppt_info) => {
        self.uploading = false;
        self.$emit('finished', new_ppt_info.data.ppt_id, true)
      })
    },
    useExpVer: function(exp_ver) {
      if (exp_ver === 2) {
        this.compensation = [7, 13]
      } else {
        this.compensation = [7, 9, 11, 13]
      }
    }
  },
  filters: {
    parseDate: function (num_seconds) {
      let date_obj = new Date(num_seconds)
      let locale_string = date_obj.toLocaleString("en-US", {timeZone: "America/Chicago"})
      locale_string = locale_string.replace(", ", " at ")

      return (locale_string)

    }
  },
  created: function() {

    // get condition
    var get_data = fb_functions.httpsCallable('getPptData');

    // not a record, but a form
    if (this.record === false) {
      get_data({ppt_id: this.pptId, attribute: 'exp_ver'}).then((res) => {
        let exp_ver = res.data
        this.useExpVer(exp_ver);
      });

    // record mode
    } else {
      get_data({ppt_id: this.pptId, attribute: ['exp_ver', 'consent', 'permissions']}).then((res) => {
        // store results
        this.given_data = res.data;

        // use experiment version
        this.useExpVer(this.given_data.exp_ver);

      });
    }

  }
}

</script>
