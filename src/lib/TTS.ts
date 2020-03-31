
let instance: TTS | null = null;
export class TTS {
  private synth: SpeechSynthesis;
  public static get instance(): TTS {
    if (instance === null) {
      instance = new TTS();
    }
    return instance;
  }
  private constructor() {
    this.synth = window.speechSynthesis;
  }

  say(text:string){

    if (text !== "") {
      console.log(text);
      
      var utterThis = new SpeechSynthesisUtterance(text);
      utterThis.onend = function(event) {
      };
      utterThis.onerror = function(event) {
        console.log(event);
      };
      this.synth.cancel()
      this.synth.speak(utterThis);
      
    }
  }
}


