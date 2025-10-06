// src/components/chat/DevicePicker.tsx
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface DevicePickerProps {
  devices: MediaDeviceInfo[];
  selectedDevice?: string;
  onChange: (deviceId: string) => void;
  disabled?: boolean;
}

const DevicePicker: React.FC<DevicePickerProps> = ({
  devices,
  selectedDevice,
  onChange,
  disabled,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="audio-device">Audio Input</Label>
      <Select
        value={selectedDevice}
        onValueChange={onChange}
        disabled={disabled || devices.length === 0}
      >
        <SelectTrigger id="audio-device">
          <SelectValue placeholder="Select a device" />
        </SelectTrigger>
        <SelectContent>
          {devices.map(device => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Device ${device.deviceId.substring(0, 8)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DevicePicker;