// Central route builders so screens and navigation stay in sync.
export const paths = {
  overview: () => '/',
  app: (id: string) => `/app/${id}`,
  container: (appId: string, cid: string) => `/app/${appId}/container/${cid}`,
  alarms: () => '/alarms',
  incident: (id: string) => `/incident/${id}`,
  add: () => '/add',
  settings: () => '/settings',
} as const;
