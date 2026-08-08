import { api } from './client';
import type {
  ApiResponse,
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintSummary,
  CreateComplaintInput,
  LecturerSummary,
  Paginated,
} from '@/types';

export interface ComplaintListParams {
  search?: string;
  status?: ComplaintStatus;
  category?: ComplaintCategory;
  priority?: ComplaintPriority;
  page?: number;
  size?: number;
}

export async function getComplaints(params: ComplaintListParams = {}): Promise<ApiResponse<Paginated<ComplaintSummary>>> {
  const { data } = await api.get('/complaints', { params });
  return data;
}

export async function getComplaint(id: string): Promise<ApiResponse<Complaint>> {
  const { data } = await api.get(`/complaints/${id}`);
  return data;
}

export async function createComplaint(input: CreateComplaintInput): Promise<ApiResponse<Complaint>> {
  const formData = new FormData();
  formData.append('subject', input.subject);
  formData.append('description', input.description);
  formData.append('category', input.category);
  formData.append('priority', input.priority);
  formData.append('anonymous', String(input.anonymous));
  input.files.forEach((file) => formData.append('files', file));
  const { data } = await api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function addComplaintReply(id: string, message: string): Promise<ApiResponse<Complaint>> {
  const { data } = await api.post(`/complaints/${id}/replies`, { message });
  return data;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  resolution?: string,
): Promise<ApiResponse<Complaint>> {
  const { data } = await api.patch(`/complaints/${id}/status`, { status, resolution });
  return data;
}

export async function assignComplaint(id: string, assignedTo: string): Promise<ApiResponse<Complaint>> {
  const { data } = await api.put(`/complaints/${id}/assign`, { assignedTo });
  return data;
}

export async function suggestComplaintReply(id: string): Promise<ApiResponse<{ suggestion: string }>> {
  const { data } = await api.post(`/complaints/${id}/suggest-reply`);
  return data;
}

export async function getLecturers(): Promise<ApiResponse<LecturerSummary[]>> {
  const { data } = await api.get('/lecturers');
  return data;
}

export function getComplaintAttachmentUrl(complaintId: string, attachmentId: string): string {
  return `/api/v1/complaints/${complaintId}/attachments/${attachmentId}`;
}
