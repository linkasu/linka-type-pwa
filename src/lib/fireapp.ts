import * as firebase from 'firebase'
import * as analytics from "@firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBHwz_IGbuPDX6CUCnc-tj2wPdimgmoGZc",
  authDomain: "distypepro-android.firebaseapp.com",
  databaseURL: "https://distypepro-android.firebaseio.com",
  projectId: "distypepro-android",
  storageBucket: "distypepro-android.appspot.com",
  messagingSenderId: "800888317067",
  appId: "1:800888317067:web:a8594b3e24f430cf"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);



export default firebase