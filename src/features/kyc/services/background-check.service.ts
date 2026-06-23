import api from '@/core/api/axiosinstance';

export type BackgroundCheckStatus = 'NOT_SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface BackgroundCheckState {
  status: BackgroundCheckStatus;
  url?: string;
  notes?: string;
  reviewedAt?: string;
}

export async function uploadBackgroundCheck(fileUri: string, mimeType: string, fileName: string): Promise<{ url: string; status: string }> {
  const formData = new FormData();
  formData.append('file', { uri: fileUri, type: mimeType, name: fileName } as any);
  const { data } = await api.post('/identity/background-check', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function getBackgroundCheckStatus(): Promise<BackgroundCheckState | null> {
  try {
    const { data } = await api.get<BackgroundCheckState>('/identity/background-check/status');
    return data;
  } catch (e: any) {
    if (e.response?.status === 404) return null;
    throw e;
  }
}

export async function adminReview(userId: string, approved: boolean, notes?: string): Promise<void> {
  await api.patch(`/admin/background-check/${userId}`, { approved, notes });
}
