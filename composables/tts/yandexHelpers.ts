import { ttsApi } from '~/api/tts'

export const loadYandexVoiceOptions = async () => {
  try {
    const data = await ttsApi.getVoices()
    return data.map(v => ({ id: v.id, name: v.name }))
  } catch (err) {
    console.error('Failed to load TTS voices:', err)
    return []
  }
}

export const downloadAudioBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
