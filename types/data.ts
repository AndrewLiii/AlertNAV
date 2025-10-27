export interface DeviceData {
  id: number;
  device_id: string;
  lat: number;
  lon: number;
  event: string;
  group: string;
  timestamp?: string;
}