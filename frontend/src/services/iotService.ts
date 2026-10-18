import api from './api';
import { AlertDto, DeviceDto, Scenario, TelemetryDto } from '@/types';

export const iotService = {
  getMyDevices: async (): Promise<DeviceDto[]> => {
    return api.get('/iot/devices/my');
  },

  createDevice: async (data: { deviceName: string; roomLocation?: string; macAddress?: string }): Promise<DeviceDto> => {
    return api.post('/iot/devices', data);
  },

  getTelemetryHistory: async (deviceCode: string, minutes = 60): Promise<TelemetryDto[]> => {
    return api.get(`/iot/devices/${deviceCode}/telemetry`, { params: { minutes } });
  },

  getLatestTelemetry: async (deviceCode: string): Promise<TelemetryDto> => {
    return api.get(`/iot/devices/${deviceCode}/latest`);
  },

  getAlerts: async (deviceCode: string): Promise<AlertDto[]> => {
    return api.get(`/iot/devices/${deviceCode}/alerts`);
  },

  setScenario: async (deviceCode: string, scenario: Scenario): Promise<{ deviceCode: string; scenario: Scenario }> => {
    return api.post('/iot/simulate', { deviceCode, scenario });
  },
};
