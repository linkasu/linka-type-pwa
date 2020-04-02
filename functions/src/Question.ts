export class Question {
  uid: string;
  value =  ''
  label: string;
  phrases: string[];
  type: 'string' | 'number';
  category: string;
  constructor(uid: string, label: string, phrases: string[], category: string, type: 'string' | 'number') {
    this.uid = uid
    this.label = label
    this.phrases = phrases
    this.type = type
    this.category = category

  }
}