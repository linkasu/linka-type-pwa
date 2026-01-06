import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/api'

function getAuthHeaders(): Record<string, string> {
  const token = import.meta.client ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const response = await $fetch<Category[]>('/api/categories', {
      headers: getAuthHeaders(),
    })
    return response
  },

  async getById(id: string): Promise<Category> {
    const response = await $fetch<Category>(`/api/categories/${id}`, {
      headers: getAuthHeaders(),
    })
    return response
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    const response = await $fetch<Category>('/api/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: data,
    })
    return response
  },

  async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await $fetch<Category>(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: data,
    })
    return response
  },

  async delete(id: string): Promise<void> {
    await $fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  },
}

