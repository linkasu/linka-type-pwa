import LocalMemory from './LocalMemory';

let yatts: { speak: (text: string, params: any) => void };

setTimeout(function () {
  (<any>window).ya.speechkit.settings.apikey = "8414c59e-dbe2-4066-b988-9621fe1a572f";
  console.log("init tts");
  yatts = new (<any>window).ya.speechkit.Tts({
    speaker: "jane"
  });
}, 2000);
class TTS {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | YandexVoice | null = null;
  private storage = new LocalMemory();

  public static get instance(): TTS {
    if (instance == undefined) instance = new TTS
    return instance;
  }
  constructor() {
    this.synth = window.speechSynthesis;
  }
  say(text: string) {
    if (text !== "") {

      var utterThis = new SpeechSynthesisUtterance(text);
      if (this.voice == null) {
        this.voice = this.selectedVoice;

      }

      if (this.yandex) {
        if (yatts)
          yatts.speak(text, { speaker: this.voice.voiceURI, speed: this.rate });
        return
      }
      utterThis.voice = <SpeechSynthesisVoice>this.voice;
      utterThis.pitch = this.pitch
      utterThis.rate = this.rate
      utterThis.volume = this.volume

      utterThis.onend = function (event) {
      };
      utterThis.onerror = function (event) {

      };
      this.synth.cancel()
      this.synth.speak(utterThis);
    }
  }
  stop(){
    if(this.yandex){}else{
      this.synth.cancel()
    }
  }
  
  get volume() {
    return this.storage.getNumber('volume', 1);
  };
  set volume(volume: number) {
    this.storage.setNumber('volume', volume);
  }
  get rate() {
    return this.storage.getNumber('rate', 1);
  };
  set rate(rate: number) {
    this.storage.setNumber('rate', rate);
  }
  get pitch() {
    return this.storage.getNumber('pitch', 1);
  };
  set pitch(pitch: number) {
    this.storage.setNumber('pitch', pitch);
  }
  get yandex() {
    return !!this.storage.getBoolean('yandex', false)
  }
  set yandex(value: boolean) {
    this.storage.setBoolean('yandex', value)
  }

  setVoice(uri: string) {
    const voice = this.offlineVoices.find(item => item.voiceURI === uri) || this.yandexVoices.find(item => item.voiceURI === uri)
    if (!voice) return;
    this.voice = voice;
    this.storage.setString('voiceuri', voice.voiceURI)

  }

  get offlineVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices()
  }
  get yandexVoices(): YandexVoice[] {
    return [
      { voiceURI: "zahar", text: "Захар" },
      { voiceURI: "ermil", text: "Емиль" },
      { voiceURI: "jane", text: "Джейн" },
      { voiceURI: "oksana", text: "Оксана" },
      // { voiceURI: "alena", text: "Алёна" },
      // { voiceURI: "filipp", text: "Филипп" },
      { voiceURI: "omazh", text: "Ома" }
    ]
  }
  get defaultOfflineVoice(): SpeechSynthesisVoice {


    return this.offlineVoices.find(item => item.default) || this.offlineVoices[0]
  }

  get selectedVoice(): SpeechSynthesisVoice | YandexVoice {

    const def = this.defaultOfflineVoice;
    const voices = this.offlineVoices;
    const uri = this.storage.getString('voiceuri', def ? def.voiceURI : "uri")
    if (this.yandex) {
      const voice = this.yandexVoices.find(voice => voice.voiceURI === uri);

      return voice || this.yandexVoices[0]
    }
    const voice = voices.find(voice => voice.voiceURI === uri)


    if (!voice && def) {
      this.storage.setString('voiceuri', def ? def.voiceURI : "uri")
      return this.selectedVoice
    }

    return voice!
  }
}
let instance: TTS = new TTS;
export default TTS;

interface YandexVoice {
  voiceURI: string,
  text: string
}