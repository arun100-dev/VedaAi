import axios from 'axios';
import { AssignmentFormData } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const auth = JSON.parse(localStorage.getItem('vedaai-auth') || '{}');
      const token = auth?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

export const assignmentApi = {
  async create(formData: AssignmentFormData) {
    // Get school from auth store
    let schoolName = 'School';
    if (typeof window !== 'undefined') {
      try {
        const auth = JSON.parse(localStorage.getItem('vedaai-auth') || '{}');
        schoolName = auth?.state?.user?.school || 'School';
      } catch {}
    }
    const payload = {
      title: formData.title,
      subject: formData.subject,
      className: formData.className,
      dueDate: formData.dueDate,
      questionTypes: formData.questionTypes.map(({ id, ...rest }) => rest),
      additionalInstructions: formData.additionalInstructions,
      fileName: formData.fileName,
      fileContent: formData.fileContent,
      schoolName,
    };
    const res = await api.post('/assignments', payload);
    return res.data;
  },

  async list(params?: { search?: string; page?: number; limit?: number }) {
    const res = await api.get('/assignments', { params });
    return res.data;
  },

  async get(id: string) {
    const res = await api.get(`/assignments/${id}`);
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete(`/assignments/${id}`);
    return res.data;
  },

  async regenerate(id: string) {
    const res = await api.post(`/assignments/${id}/regenerate`);
    return res.data;
  },

  async getJobStatus(jobId: string) {
    const res = await api.get(`/assignments/jobs/${jobId}/status`);
    return res.data;
  },
};

export default api;
