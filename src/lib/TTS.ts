import LocalMemory from './LocalMemory';

class TTS {
  private synth: SpeechSynthesis;
  private voice: SpeechSynthesisVoice | null = null;
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
        this.voice = this.selectedOfflineVoice;

      }
      utterThis.voice = this.voice;
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
  setVoice(uri: string) {
    const voice = this.offlineVoices.find(item => item.voiceURI === uri)
    if (!voice) return;
    this.voice = voice;
    this.storage.setString('voiceuri', voice.voiceURI)

  }

  get offlineVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices()
  }
  get defaultOfflineVoice(): SpeechSynthesisVoice {


    return this.offlineVoices.find(item => item.default) || this.offlineVoices[0]
  }

  get selectedOfflineVoice(): SpeechSynthesisVoice {
    const def = this.defaultOfflineVoice;
    const voices = this.offlineVoices;
    const uri = this.storage.getString('voiceuri', def ? def.voiceURI : "uri")
    const voice = voices.find(voice => voice.voiceURI === uri)


    if (!voice && def) {
      this.storage.setString('voiceuri', def ? def.voiceURI : "uri")
      return this.selectedOfflineVoice
    }

    return voice!
  }
}
let instance: TTS = new TTS;
export default TTS;


