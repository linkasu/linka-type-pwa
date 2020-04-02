import * as functions from 'firebase-functions';
import { database } from 'firebase-admin';
import admin = require('firebase-admin');
// import { Question } from './Question';


const ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890";
const SIZE = 16;

admin.initializeApp(functions.config().firebase);


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const createCategory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error("not auth");

  };
  const id = generateId();

  await database()
    .ref("users/" + context.auth.uid)
    .child("Category")
    .child(id)
    .set({
      created: new Date,
      label: data.title,
      id,
      statements: {}
    })
  return id;
});
export const createStatement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error("not auth");

  };
  if(data.questions){

    return data.questions
  }
  const id = generateId();
  await database()
    .ref("users/" + context.auth.uid)
    .child("Category")
    .child(data.category)
    .child("statements")
    .child(id)
    .set({
      created: new Date,
      categoryId: data.category,
      text: data.text,
      id
    })
  return id;
});

export const parseQuestionsInput = functions.https.onCall(async (data, context)=>{
  return data;
})

export const getQuestions = functions.database.ref('/factory/questions')

function generateId(): string {
  let res = '';
  for (let index = 0; index < SIZE; index++) {
    res += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return res
}