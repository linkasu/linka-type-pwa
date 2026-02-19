import { useAppServices as useRendererAppServices } from '~/src/renderer/app-context'

export function useAppServices() {
  return useRendererAppServices()
}
