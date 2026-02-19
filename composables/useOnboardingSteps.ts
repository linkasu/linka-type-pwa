import { useUserStore } from '~/stores/user'

export function useOnboardingSteps() {
  const userStore = useUserStore()
const router = useRouter()

  const currentStep = ref(1)
  const totalSteps = 3
  const isLoading = ref(false)

  const nextStep = () => {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  const finishSetup = async () => {
    isLoading.value = true
    try {
      await userStore.setInitialized()
      router.push('/main')
    } catch (err) {
      console.error('Failed to complete setup:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentStep,
    totalSteps,
    isLoading,
    nextStep,
    prevStep,
    finishSetup,
  }
}

