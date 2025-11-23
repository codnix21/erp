import api from './api';

export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  async getAll(params?: GetAuditLogsParams): Promise<{ data: AuditLog[]; meta?: any }> {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  async getOne(id: string): Promise<{ data: AuditLog }> {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },
};

