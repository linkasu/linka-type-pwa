import LocalMemory from './LocalMemory'
import {analytics} from 'firebase'
import axios from 'axios'
import { EventEmitter } from 'events'

const {setUserProperties} =  analytics()

class TTS {
  private synth: SpeechSynthesis
  private voice: SpeechSynthesisVoice | YandexVoice | null = null
  private storage = new LocalMemory()
  private audio = new Audio()
  public events = new EventEmitter()
  public static get instance(): TTS {
    if (instance == undefined) instance = new TTS()
    return instance
  }
  constructor() {
    if (window.speechSynthesis == null) {
      this.yandex = true
    }
    this.synth = window.speechSynthesis
  }
  say(text: string, download = false) {
    if (text !== '') {
      var utterThis = new SpeechSynthesisUtterance(text)
      if (this.voice == null) {
        this.voice = this.selectedVoice
      }
      this.events.emit('start')
      if (this.yandex) {
        this.yandexSay(text, { speaker: this.voice.voiceURI, speed: this.rate }, download)
        return
      }
      utterThis.voice = <SpeechSynthesisVoice>this.voice
      utterThis.pitch = this.pitch
      utterThis.rate = this.rate
      utterThis.volume = this.volume

      utterThis.onend = (event) => {
        this.events.emit('end')
      }
      utterThis.onerror = function (event) {}
      this.synth.cancel()
      this.synth.speak(utterThis)
    }
  }
  async yandexSay(
    text: string,
    params: { speaker: string; speed: number },
    download = false,
  ) {
    const response = await axios.post(
      'https://tts.linka.su/tts',
      {
        text,
        voice: params.speaker,
      },
      {
        responseType: 'arraybuffer',
      },
    )

    const blob = new Blob([response.data], { type: 'audio/mp3' })
    const url = window.URL.createObjectURL(blob)

    if (download) {
      console.log('download');
      
      let link = document.createElement('a')
      link.download = 'LINKa. напиши. '+text.substring(0, 5)+'.mp3'
      link.href = url
      link.click()

      URL.revokeObjectURL(link.href)
      this.events.emit('end')
      return
    }
    this.audio.pause()
    this.audio.src = url
    await this.audio.play()
    this.audio.onended = () => this.events.emit('end')
  }
  stop() {
    if (this.yandex) {
      this.audio.pause()
    } else {
      this.synth.cancel()
    }
  }

  get volume() {
    return this.storage.getNumber('volume', 1)
  }
  set volume(volume: number) {
    this.storage.setNumber('volume', volume)
  }
  get rate() {
    return this.storage.getNumber('rate', 1)
  }
  set rate(rate: number) {
    this.storage.setNumber('rate', rate)
  }
  get pitch() {
    return this.storage.getNumber('pitch', 1)
  }
  set pitch(pitch: number) {
    this.storage.setNumber('pitch', pitch)
  }
  get yandex() {
    const value = !!this.storage.getBoolean('yandex', false)
    setUserProperties( { use_yandex: value })

    return value
  }
  set yandex(value: boolean) {
    this.storage.setBoolean('yandex', value)
  }

  setVoice(uri: string) {
    const voice =
      this.offlineVoices.find((item) => item.voiceURI === uri) ||
      this.yandexVoices.find((item) => item.voiceURI === uri)

    if (!voice) return
    this.storage.setString('voiceuri', voice.voiceURI)
    this.voice = voice
  }

  get offlineVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices()
  }
  get yandexVoices(): YandexVoice[] {
    return [
      { voiceURI: 'zahar', text: 'Захар' },
      { voiceURI: 'ermil', text: 'Емиль' },
      { voiceURI: 'jane', text: 'Джейн' },
      { voiceURI: 'oksana', text: 'Оксана' },
      { voiceURI: 'alena', text: 'Алёна' },
      { voiceURI: 'filipp', text: 'Филипп' },
      { voiceURI: 'omazh', text: 'Ома' },
    ]
  }
  get defaultOfflineVoice(): SpeechSynthesisVoice {
    return (
      this.offlineVoices.find((item) => item.default) || this.offlineVoices[0]
    )
  }

  get selectedVoice(): SpeechSynthesisVoice | YandexVoice {
    const def = this.defaultOfflineVoice
    const voices = this.offlineVoices
    const uri = this.storage.getString('voiceuri', def ? def.voiceURI : 'uri')
    if (this.yandex) {
      const voice = this.yandexVoices.find((voice) => voice.voiceURI === uri)
      setUserProperties( { voice: voice!.voiceURI })
      return voice || this.yandexVoices[0]
    }
    const voice = voices.find((voice) => voice.voiceURI === uri)

    if (!voice && def) {
      this.storage.setString('voiceuri', def ? def.voiceURI : 'uri')
      return this.selectedVoice
    }
    setUserProperties( { voice: voice!.voiceURI })
    return voice!
  }
}
let instance: TTS = new TTS()
export default TTS

interface YandexVoice {
  voiceURI: string
  text: string
}
