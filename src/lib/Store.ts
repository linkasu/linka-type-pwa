import fireapp from "./fireapp";
import firebase from 'firebase';

export default class Store {
  async createCategory(title: string) {
    if (!this.root) throw "not init";
    const id = this.generateId()

    await this.root
      .child("Category")
      .child(id)
      .set({
        created: +new Date(),
        label: title,
        id,
        statements: {}
      });
    return id;
  }
  async createStatement(cid: string, text: string) {
    if (!this.root) throw "not init";
    const id = this.generateId()
    await this.root
      .child("Category")
      .child(cid)
      .child("statements")
      .child(id)
      .set({
        created: +new Date(),
        categoryId: cid,
        text,
        id
      });
    return id
  }
  get root(): firebase.database.Reference | null {
    const user = fireapp.auth().currentUser
    if (user == null) return null;
    const uid = user.uid
    return fireapp.database().ref("/users/" + uid)
  }
  get factory(): firebase.database.Reference {
    return fireapp.database().ref('factory')
  }



  private static ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890";
  private static SIZE = 16;

  private generateId(): string {
    let res = "";
    for (let index = 0; index < Store.SIZE; index++) {
      res += Store.ALPHABET[Math.floor(Math.random() * Store.ALPHABET.length)];
    }
    return res;
  }
}

