import { request } from './client';
import type {
  ApiAction,
  ApiAlarm,
  ApiAlarmDetail,
  ApiAlarmRule,
  ApiApp,
  ApiChannel,
  ApiContainer,
  ApiLog,
  ApiMetric,
  ApiRemediationRule,
  ApiSettings,
  ApiToken,
  ApiUser,
} from './types';

export const api = {
  login: (email: string, password: string) =>
    request<ApiToken>('/auth/login', { method: 'POST', form: { username: email, password } }),
  register: (email: string, fullName: string, password: string) =>
    request<ApiUser>('/auth/register', { method: 'POST', body: { email, fullName, password } }),
  me: () => request<ApiUser>('/auth/me'),

  listApps: () => request<ApiApp[]>('/apps'),
  createApp: (body: unknown) => request<ApiApp>('/apps', { method: 'POST', body }),

  listContainers: (appId: string) => request<ApiContainer[]>(`/apps/${appId}/containers`),
  getContainer: (id: string) => request<ApiContainer>(`/containers/${id}`),
  runAction: (id: string, action: string) =>
    request<ApiAction>(`/containers/${id}/actions`, { method: 'POST', body: { action } }),
  listMetrics: (id: string, limit = 40) =>
    request<ApiMetric[]>(`/containers/${id}/metrics`, { query: { limit: String(limit) } }),
  listLogs: (id: string, limit = 100) =>
    request<ApiLog[]>(`/containers/${id}/logs`, { query: { limit: String(limit) } }),

  listAlarms: (params: { state?: string; severity?: string; appId?: string } = {}) =>
    request<ApiAlarm[]>('/alarms', { query: params }),
  getAlarm: (id: string) => request<ApiAlarmDetail>(`/alarms/${id}`),
  acknowledgeAlarm: (id: string) => request<ApiAlarmDetail>(`/alarms/${id}/acknowledge`, { method: 'POST' }),
  resolveAlarm: (id: string) => request<ApiAlarmDetail>(`/alarms/${id}/resolve`, { method: 'POST' }),

  listAlarmRules: () => request<ApiAlarmRule[]>('/rules/alarm'),
  createAlarmRule: (body: unknown) => request<ApiAlarmRule>('/rules/alarm', { method: 'POST', body }),
  updateAlarmRule: (id: string, body: unknown) =>
    request<ApiAlarmRule>(`/rules/alarm/${id}`, { method: 'PATCH', body }),
  deleteAlarmRule: (id: string) => request<void>(`/rules/alarm/${id}`, { method: 'DELETE' }),

  listRemediationRules: () => request<ApiRemediationRule[]>('/rules/remediation'),
  updateRemediationRule: (id: string, body: unknown) =>
    request<ApiRemediationRule>(`/rules/remediation/${id}`, { method: 'PATCH', body }),

  listChannels: () => request<ApiChannel[]>('/notifications/channels'),
  updateChannel: (id: string, body: unknown) =>
    request<ApiChannel>(`/notifications/channels/${id}`, { method: 'PATCH', body }),

  getSettings: () => request<ApiSettings>('/settings'),
  updateSettings: (body: unknown) => request<ApiSettings>('/settings', { method: 'PUT', body }),

  evaluate: () =>
    request<{ created: number; resolved: number; remediated: number }>('/engine/evaluate', { method: 'POST' }),
};
