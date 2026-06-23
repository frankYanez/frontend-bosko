import { Id } from "../interfaces/common";
import { Category, UpdateCategoryDto } from "../interfaces/category";
import api from "@/core/api/axiosinstance";
import { fetchCategoriesService, mapCategory } from "@/features/servicesUser/services/catalog";

/**
 * Delegates to the canonical fetchCategoriesService in catalog.ts.
 * Both Category types are structurally compatible.
 */
export async function listCategories(): Promise<Category[]> {
  return fetchCategoriesService() as unknown as Promise<Category[]>;
}

export async function getCategory(id: Id): Promise<Category> {
  const { data } = await api.get<any>(`/categories/${id}`);
  return mapCategory(data) as unknown as Category;
}

export async function updateCategory(
  id: Id,
  payload: UpdateCategoryDto
): Promise<Category> {
  const { data } = await api.patch<any>(`/categories/${id}`, payload);
  return mapCategory(data) as unknown as Category;
}

export async function deleteCategory(id: Id): Promise<void> {
  await api.delete(`/categories/${id}`);
}
