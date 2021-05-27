// these Firebase functions can only be initialized once, so here they are!

const FUNCTIONS = require('firebase-functions');

// The Firebase Admin SDK to access Cloud Firestore.
const ADMIN = require('firebase-admin');
const app = ADMIN.initializeApp();

// initialize database up top
const DB = ADMIN.database();


module.exports = {
  DB,
  FUNCTIONS,
  ADMIN
};
