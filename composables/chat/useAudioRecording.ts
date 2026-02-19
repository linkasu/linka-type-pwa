import type { Ref } from 'vue'
import { pickMimeType } from './recordingUtils'
import { createWavRecorder } from './wavRecorder'

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
  const wavRecorder = createWavRecorder()

  const stopStream = () => {
    recorderStream?.getTracks().forEach(track => track.stop())
    recorderStream = null
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
    if (!recorderStream) {
      recordingError.value = options.t('chat.errors.micUnsupported')
      return
    }

    const started = await wavRecorder.start(recorderStream)
    if (!started) {
      recordingError.value = options.t('chat.errors.micUnsupported')
      return
    }

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
    const blob = wavRecorder.stop()
    stopStream()
    if (shouldSendRecording && blob.size > 0) {
      void options.onRecordingReady(blob, 'audio/wav')
    }
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
    void wavRecorder.cleanup()
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
