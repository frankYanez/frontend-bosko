
import { Id } from "../interfaces/common";
import { Category, UpdateCategoryDto } from "../interfaces/category";
import api from "@/core/api/axiosinstance";

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<any>('/categories');
  const raw: any[] = Array.isArray(data) ? data : (data?.data ?? []);
  return raw.map((cat: any) => ({
    id: cat.id,
    name: cat.name ?? '',
    description: cat.description ?? '',
    icon: cat.icon ?? undefined,
    accent: cat.accent ?? undefined,
  }));
}

export async function getCategory(id: Id): Promise<Category> {
  const categories = await listCategories();
  const found = categories.find(c => c.id === id);
  if (!found) throw new Error(`Category ${id} not found`);
  return found;
}

export async function updateCategory(
  id: Id,
  payload: UpdateCategoryDto
): Promise<Category> {
  const { data } = await api.patch<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: Id): Promise<void> {
  await api.delete(`/categories/${id}`);
}
