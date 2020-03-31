import  fireapp  from "./fireapp";
import firebase from 'firebase';

export default class Store {
  get root () : firebase.database.Reference|null {
    const user = fireapp.auth().currentUser
    if(user ==null) return null;
    const uid = user.uid
    return fireapp.database().ref("/users/" + uid)
  }
}