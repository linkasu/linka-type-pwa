const RECORD_MIME_TYPE = 'audio/ogg;codecs=opus'

export const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return ''
  if (MediaRecorder.isTypeSupported(RECORD_MIME_TYPE)) return RECORD_MIME_TYPE
  const fallbacks = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
  return fallbacks.find(type => MediaRecorder.isTypeSupported(type)) ?? ''
}

const writeWavString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i))
  }
}

export const encodeWav = (chunks: Float32Array[], sampleRate: number): Blob => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const buffer = new ArrayBuffer(44 + totalLength * 2)
  const view = new DataView(buffer)

  writeWavString(view, 0, 'RIFF')
  view.setUint32(4, 36 + totalLength * 2, true)
  writeWavString(view, 8, 'WAVE')
  writeWavString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeWavString(view, 36, 'data')
  view.setUint32(40, totalLength * 2, true)

  let offset = 44
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, chunk[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}
