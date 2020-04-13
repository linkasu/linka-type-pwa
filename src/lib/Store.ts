import fireapp from "./fireapp";
import firebase from 'firebase';
import { Statement } from './Statement';
import { Category } from './Category';
import { StoreItem } from './StoreItem';

export default class Store {

  static sortItems<T extends Category | Statement>(items: T[]): T[] {
    return items.sort((a, b) => {
      if ((<Category>a).default !== null && (<Category>a).default !== (<Category>b).default) {
        return (<Category>a).default ? -1 : 1;
      }
      return a.created - b.created;
    })
  }

  global = fireapp.database().ref('global');
  async editCategory(item: Category, newText: string, globalEdit = false) {

    await this.getCategory(item.id, globalEdit)
      .child("label")
      .set(newText);

  }

  async editStatement(item: Statement, newText: string, globalEdit = false) {

    await this.getStatement(item.categoryId, item.id, globalEdit)
      .child("text")
      .set(newText);
  }
  getStatement(categoryId: string, id: string, globalEdit = false) {
    return this.getStatements(categoryId, globalEdit).child(id)
  }
  deleteItem(what: "category" | "statement", cid: string | null, id: string, globalEdit = false) {
    if (!this.host(globalEdit)) throw "not init";

    if (what === "category") {
      return this.getCategory(id, globalEdit).remove()
    } else if (cid) {
      return this.getStatements(cid, globalEdit)
        .child(id)
        .remove()
    }
  }
  getStatements(cid: string, globalEdit: boolean = false) {
    return this.getCategory(cid, globalEdit).child("statements")
  }
  getCategory(id: string, globalEdit: boolean = false) {
    return this.host(globalEdit)
      .child("Category")
      .child(id)
  }
  host(globalEdit: boolean) {
    return globalEdit ? this.global : this.root
  }
  async createCategory(title: string, globalEdit = false) {
    const id = this.generateId()

    await this.getCategory(id, globalEdit)
      .set({
        created: +new Date(),
        label: title,
        id,
        statements: {}
      });
    return id;
  }
  async createStatement(cid: string, text: string, globalEdit = false) {
    if (!this.root) throw "not init";
    const id = this.generateId()
    await this.getStatement(cid, id, globalEdit)
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
  async isAdmin(): Promise<boolean> {
    const user = fireapp.auth().currentUser
    if (!user) throw "not init";
    try {
      const value = await fireapp.database().ref().child('admins').child(user.uid).once('value')
      return value.exists()

    } catch (error) {
      return false;
    }
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

