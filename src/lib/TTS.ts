class TTS {
  private synth: SpeechSynthesis;
  public static get instance(): TTS {
    return instance;
  }
  constructor() {
    this.synth = window.speechSynthesis;
  }
  say(text:string){
    if (text !== "") {
      
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

  get offlineVoices ():SpeechSynthesisVoice[]{
    return this.synth.getVoices()
  }
}
let instance: TTS  = new TTS;
export default TTS;


