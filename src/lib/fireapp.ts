
import app, { auth, database, functions, analytics, FirebaseError } from 'firebase/app'
import  'firebase/auth'
import 'firebase/database'
import 'firebase/functions'
import 'firebase/analytics'

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
// Initialize Firebase
app.initializeApp(firebaseConfig);
auth().languageCode='ru'
analytics()

console.log(database());



export default {
  app,
  auth:auth,
  database:database,
  functions:functions,
  analytics:analytics
}