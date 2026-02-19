import type { Ref } from 'vue'
import { encodeWav, pickMimeType } from './recordingUtils'

type RecordingOptions = {
  t: (key: string) => string
  isBusy: Ref<boolean>
  onRecordingReady: (blob: Blob, mimeType: string) => Promise<void> | void
}

export function useAudioRecording(options: RecordingOptions) {
  const isRecording = ref(false)
  const recordingError = ref<string | null>(null)
  const recordingDuration = ref(0)

  let recordingMimeType = ''
  let recorder: MediaRecorder | null = null
  let recorderStream: MediaStream | null = null
  let recorderChunks: Blob[] = []
  let recordingTimer: number | null = null
  let shouldSendRecording = true
  let recordingMode: 'ogg' | 'wav' = 'ogg'
  let audioContext: AudioContext | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let processorNode: ScriptProcessorNode | null = null
  let zeroGain: GainNode | null = null
  let wavChunks: Float32Array[] = []
  let wavSampleRate = 48000

  const stopStream = () => {
    recorderStream?.getTracks().forEach(track => track.stop())
    recorderStream = null
  }

  const cleanupWavNodes = async () => {
    if (processorNode) {
      processorNode.disconnect()
      processorNode.onaudioprocess = null
      processorNode = null
    }
    if (sourceNode) {
      sourceNode.disconnect()
      sourceNode = null
    }
    if (zeroGain) {
      zeroGain.disconnect()
      zeroGain = null
    }
    if (audioContext) {
      try {
        await audioContext.close()
      } catch {
        // ignore close errors
      }
      audioContext = null
    }
  }

  const startRecordingTimer = () => {
    recordingDuration.value = 0
    const start = Date.now()
    if (recordingTimer) {
      clearInterval(recordingTimer)
    }
    recordingTimer = window.setInterval(() => {
      recordingDuration.value = Date.now() - start
    }, 500)
  }

  const stopRecordingTimer = () => {
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
  }

  const startWavRecording = async () => {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx || !recorderStream) {
      recordingError.value = options.t('chat.errors.micUnsupported')
      return
    }

    audioContext = new AudioCtx()
    await audioContext.resume()
    wavSampleRate = audioContext.sampleRate
    wavChunks = []

    sourceNode = audioContext.createMediaStreamSource(recorderStream)
    processorNode = audioContext.createScriptProcessor(4096, 1, 1)
    zeroGain = audioContext.createGain()
    zeroGain.gain.value = 0

    processorNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0)
      wavChunks.push(new Float32Array(input))
    }

    sourceNode.connect(processorNode)
    processorNode.connect(zeroGain)
    zeroGain.connect(audioContext.destination)

    recordingMode = 'wav'
    isRecording.value = true
    startRecordingTimer()
  }

  const startRecording = async () => {
    if (isRecording.value || options.isBusy.value) return
    if (!navigator.mediaDevices?.getUserMedia) {
      recordingError.value = options.t('chat.errors.micUnsupported')
      return
    }

    recordingError.value = null
    shouldSendRecording = true

    try {
      recorderStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordingMimeType = pickMimeType()

      if (recordingMimeType && MediaRecorder.isTypeSupported(recordingMimeType)) {
        recorder = new MediaRecorder(recorderStream, { mimeType: recordingMimeType })
        recorderChunks = []

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recorderChunks.push(event.data)
          }
        }

        recorder.onstop = async () => {
          const recorderInstance = recorder
          stopStream()
          stopRecordingTimer()
          isRecording.value = false
          recorder = null

          if (!shouldSendRecording) {
            recorderChunks = []
            return
          }

          const type = recorderInstance?.mimeType || recordingMimeType || 'audio/ogg;codecs=opus'
          const blob = new Blob(recorderChunks, { type })
          recorderChunks = []
          if (!blob.size) {
            return
          }
          await options.onRecordingReady(blob, type)
        }

        recorder.onerror = () => {
          recordingError.value = options.t('chat.errors.sendAudio')
          isRecording.value = false
          recorder = null
          stopStream()
        }

        recordingMode = 'ogg'
        recorder.start()
        isRecording.value = true
        startRecordingTimer()
      } else {
        await startWavRecording()
      }
    } catch (err: unknown) {
      stopStream()
      const failure = err as Error
      recordingError.value = failure.message || options.t('chat.errors.micDenied')
    }
  }

  const stopRecording = (send = true) => {
    if (!isRecording.value) return
    shouldSendRecording = send

    if (recordingMode === 'ogg') {
      if (!recorder || recorder.state !== 'recording') return
      recorder.stop()
      return
    }

    isRecording.value = false
    stopRecordingTimer()
    const blob = encodeWav(wavChunks, wavSampleRate)
    wavChunks = []
    stopStream()
    cleanupWavNodes().finally(() => {
      if (shouldSendRecording && blob.size > 0) {
        void options.onRecordingReady(blob, 'audio/wav')
      }
    })
  }

  const toggleRecording = () => {
    if (isRecording.value) {
      stopRecording(true)
    } else {
      void startRecording()
    }
  }

  const stopRecordingAndDiscard = () => {
    if (isRecording.value) {
      stopRecording(false)
    }
  }

  const cleanupRecording = () => {
    stopRecordingAndDiscard()
    stopStream()
    stopRecordingTimer()
    void cleanupWavNodes()
  }

  onUnmounted(() => {
    cleanupRecording()
  })

  return {
    isRecording,
    recordingError,
    recordingDuration,
    startRecording,
    stopRecording,
    toggleRecording,
    stopRecordingAndDiscard,
    cleanupRecording,
  }
}
