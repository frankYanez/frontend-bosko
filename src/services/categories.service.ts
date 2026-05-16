
import { Id } from "../interfaces/common";
import { Category, UpdateCategoryDto } from "../interfaces/category";
import api from "@/core/api/axiosinstance";

export async function listCategories(): Promise<Category[]> {
  const { data } = await api.get<any>('/services', { params: { limit: 100 } });
  const services: any[] = (data as any)?.data ?? [];
  const seen = new Set<string>();
  const categories: Category[] = [];
  for (const s of services) {
    const cat = s.category;
    if (cat?.id && !seen.has(cat.id)) {
      seen.add(cat.id);
      categories.push({
        id: cat.id,
        name: cat.name ?? '',
        description: cat.description ?? '',
        icon: cat.icon,
        accent: cat.accent,
      });
    }
  }
  return categories;
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
