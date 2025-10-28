export interface User {
  id: number;
  email: string;
  created_at?: string;
  last_login?: string;
}

export interface DeviceData {
  id: number;
  device_id: string;
  lat: number;
  lon: number;
  event: string;
  group: string;
  timestamp?: string;
  user_email?: string;
}