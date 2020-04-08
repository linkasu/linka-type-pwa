import fireapp from "./fireapp";
import firebase from 'firebase';
import { Statement } from './Statement';
import { Category } from './Category';

export default class Store {
  async editCategory(item: Category, newText: string) {

    await this.getCategory(item.id)
      .child("label")
      .set(newText);

  }

  async editStatement(item: Statement, newText: string) {

    await this.getStatement(item.categoryId, item.id)
      .child("text")
      .set(newText);
  }
  getStatement(categoryId: string, id: string) {
    return this.getStatements(categoryId).child(id)
  }
  deleteItem(what: "category" | "statement", cid: string | null, id: string) {
    if (!this.root) throw "not init";

    if (what === "category") {
      return this.getCategory(id).remove()
    } else if (cid) {
      return this.getStatements(cid)
        .child(id)
        .remove()
    }
  }
  getStatements(cid: string) {
    return this.getCategory(cid).child("statements")
  }
  getCategory(id: string) {
    return this.root
      .child("Category")
      .child(id)
  }
  async createCategory(title: string) {
    const id = this.generateId()

    await this.getCategory(id)
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
    await this.getStatement(cid, id)
      .set({
        created: +new Date(),
        categoryId: cid,
        text,
        id
      });
    return id
  }
  get root(): firebase.database.Reference {
    const user = fireapp.auth().currentUser
    if (!user) throw "not init";
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

