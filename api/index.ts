export { createApiClient, getApiClient } from './client'
export { authApi } from './auth'
export { categoriesApi } from './categories'
export { statementsApi } from './statements'
export { quickesApi } from './quickes'
export { userApi } from './user'
export { globalApi } from './global'
export { ttsApi } from './tts'
export { onboardingApi } from './onboarding'

// Combined API object for use in plugins
export const api = {
  auth: {
    login: (data: import('~/types/api').LoginRequest) => import('./auth').then(m => m.authApi.login(data)),
  },
  categories: {
    getAll: () => import('./categories').then(m => m.categoriesApi.getAll()),
    getById: (id: string) => import('./categories').then(m => m.categoriesApi.getById(id)),
    create: (data: import('~/types/api').CreateCategoryRequest) => import('./categories').then(m => m.categoriesApi.create(data)),
    update: (id: string, data: import('~/types/api').UpdateCategoryRequest) => import('./categories').then(m => m.categoriesApi.update(id, data)),
    delete: (id: string) => import('./categories').then(m => m.categoriesApi.delete(id)),
  },
  statements: {
    getByCategory: (categoryId: string) => import('./statements').then(m => m.statementsApi.getByCategory(categoryId)),
    getById: (id: string) => import('./statements').then(m => m.statementsApi.getById(id)),
    create: (data: import('~/types/api').CreateStatementRequest) => import('./statements').then(m => m.statementsApi.create(data)),
    update: (id: string, data: import('~/types/api').UpdateStatementRequest) => import('./statements').then(m => m.statementsApi.update(id, data)),
    delete: (id: string) => import('./statements').then(m => m.statementsApi.delete(id)),
  },
  quickes: {
    get: () => import('./quickes').then(m => m.quickesApi.get()),
    update: (data: import('~/types/api').UpdateQuickesRequest) => import('./quickes').then(m => m.quickesApi.update(data)),
  },
  user: {
    getState: () => import('./user').then(m => m.userApi.getState()),
    updateState: (data: import('~/types/api').UpdateUserStateRequest) => import('./user').then(m => m.userApi.updateState(data)),
    deleteAccount: (data: import('~/types/api').DeleteAccountRequest) => import('./user').then(m => m.userApi.deleteAccount(data)),
  },
  global: {
    getCategories: (includeStatements?: boolean) => import('./global').then(m => m.globalApi.getCategories(includeStatements)),
    getCategoryStatements: (categoryId: string) => import('./global').then(m => m.globalApi.getCategoryStatements(categoryId)),
    importCategory: (data: import('~/types/api').ImportCategoryRequest) => import('./global').then(m => m.globalApi.importCategory(data)),
  },
  tts: {
    getVoices: () => import('./tts').then(m => m.ttsApi.getVoices()),
    synthesize: (data: import('~/types/api').TTSRequest) => import('./tts').then(m => m.ttsApi.synthesize(data)),
  },
  onboarding: {
    getQuestions: () => import('./onboarding').then(m => m.onboardingApi.getQuestions()),
    generatePhrases: (data: import('~/types/api').OnboardingRequest) => import('./onboarding').then(m => m.onboardingApi.generatePhrases(data)),
  },
}

