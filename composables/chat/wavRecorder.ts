import { encodeWav } from './recordingUtils'

const resolveAudioContextConstructor = () => {
  return window.AudioContext
    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
}

export const createWavRecorder = () => {
  let audioContext: AudioContext | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let processorNode: ScriptProcessorNode | null = null
  let zeroGain: GainNode | null = null
  let chunks: Float32Array[] = []
  let sampleRate = 48000

  const cleanup = async () => {
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
        // Ignore close errors.
      }
      audioContext = null
    }
  }

  const start = async (stream: MediaStream) => {
    const AudioCtx = resolveAudioContextConstructor()
    if (!AudioCtx) {
      return false
    }

    audioContext = new AudioCtx()
    await audioContext.resume()
    sampleRate = audioContext.sampleRate
    chunks = []

    sourceNode = audioContext.createMediaStreamSource(stream)
    processorNode = audioContext.createScriptProcessor(4096, 1, 1)
    zeroGain = audioContext.createGain()
    zeroGain.gain.value = 0

    processorNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0)
      chunks.push(new Float32Array(input))
    }

    sourceNode.connect(processorNode)
    processorNode.connect(zeroGain)
    zeroGain.connect(audioContext.destination)

    return true
  }

  const stop = () => {
    const blob = encodeWav(chunks, sampleRate)
    chunks = []
    void cleanup()
    return blob
  }

  return {
    start,
    stop,
    cleanup,
  }
}
