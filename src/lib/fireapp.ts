import { analytics, app, auth, database, functions, initializeApp } from "firebase";

const firebaseConfig  = {
  apiKey: "AIzaSyBHwz_IGbuPDX6CUCnc-tj2wPdimgmoGZc",
  authDomain: "distypepro-android.firebaseapp.com",
  databaseURL: "https://distypepro-android.firebaseio.com",
  projectId: "distypepro-android",
  storageBucket: "distypepro-android.appspot.com",
  messagingSenderId: "800888317067",
  appId: "1:800888317067:web:a8594b3e24f430cf",
  measurementId: "G-RM812X3EM4"
};

initializeApp(firebaseConfig)
auth().languageCode='ru'


export default {
  app: app,
  auth:auth,
  database: database,
  functions,
  analytics
}