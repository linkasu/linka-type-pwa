import * as functions from 'firebase-functions';
import { database } from 'firebase-admin';
import admin = require('firebase-admin');
import { Question } from './Question';
import { CallableContext } from 'firebase-functions/lib/providers/https';
// import { Question } from './Question';


const ALPHABET = "abcdefghijklmnopqrstuvwxyz1234567890";
const SIZE = 16;

admin.initializeApp(functions.config().firebase);


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const createCategory = functions.https.onCall(createCategoryCaller)
export const createStatement = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error("not auth");

  };
  if (data.questions) {
    const initRef = database()
      .ref("users/" + context.auth.uid)
      .child('inited');
    if (!await (await initRef.once('value')).val())
      await questionsCreater(data.questions, context)
    initRef.set(true)
    return 'done'
  }
  const id = createStatementCaller(data, context);
  return id;
});

export const importFromGlobal = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error("not auth");

  };

  const ref = database()
    .ref('/users/' + context.auth.uid + '/Category/' + data.id);
  if (!data.force && (await ref.once('value')).exists()) {
    return 'exists'
  }
  const source = database()
  .ref('/global/Category/'+data.id)
  const obj = await (await source.once('value')).val()
  console.log(obj);
  
  ref.set(obj)
  return 'done'
})

export const getQuestions = functions.database.ref('/factory/questions')


async function createCategoryCaller(data: { title: string, isDefault: boolean }, context: CallableContext) {
  if (!context.auth) {
    throw new Error("not auth");

  };
  const id = generateId();

  await database()
    .ref("users/" + context.auth.uid)
    .child("Category")
    .child(id)
    .set({
      created: +new Date,
      label: data.title,
      default: data.isDefault,
      id,
      statements: {}
    })
  return id;
};

async function createStatementCaller(data: { category: string, text: string }, context: CallableContext) {

  const id = generateId();
  await database()
    .ref("users/" + context.auth!.uid)
    .child("Category")
    .child(data.category)
    .child("statements")
    .child(id)
    .set({
      created: +new Date,
      categoryId: data.category,
      text: data.text,
      id
    })
  return id;
}

function generateId(): string {
  let res = '';
  for (let index = 0; index < SIZE; index++) {
    res += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return res
}

async function questionsCreater(questions: Question[], context: CallableContext) {
  for (const question of questions) {
    if (question.value.length < 1) continue
    const category = await getOrCreateCategoryByName(question.category, context);
    for (const phrase of question.phrases) {
      await createStatementCaller({ category, text: phrase.replace('%%', question.value) }, context);
    }
  }
  return true
}

async function getOrCreateCategoryByName(name: string, context: CallableContext): Promise<string> {

  const categories = <{ id: string, label: string }[]>Object.values((await database()
    .ref("users/" + context.auth!.uid)
    .child("Category/")
    .once("value")).val() || [])

  const category = categories.find(({ label }) => label === name)
  if (category) {
    return category.id
  } else {
    return await createCategoryCaller({ title: name, isDefault: categories.length < 1 }, context)
  }
}