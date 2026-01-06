import { getApiClient } from './client'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '~/types/api'

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    const client = getApiClient()
    const response = await client.get<Category[]>('/categories')
    return response.data
  },

  async getById(id: string): Promise<Category> {
    const client = getApiClient()
    const response = await client.get<Category>(`/categories/${id}`)
    return response.data
  },

  async create(data: CreateCategoryRequest): Promise<Category> {
    const client = getApiClient()
    const response = await client.post<Category>('/categories', data)
    return response.data
  },

  async update(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const client = getApiClient()
    const response = await client.patch<Category>(`/categories/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    const client = getApiClient()
    await client.delete(`/categories/${id}`)
  },
}

