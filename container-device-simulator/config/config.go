package config

import (
	"encoding/json"
	"os"
)

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type DeviceConfig struct {
	DeviceID          string   `json:"deviceId"`
	Location          Location `json:"location"`
	RegistrationToken string   `json:"registrationToken,omitempty"`
	MqttUsername      string   `json:"mqttUsername,omitempty"`
	MqttPassword      string   `json:"mqttPassword,omitempty"`
}

func LoadDevices(path string) ([]DeviceConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var devices []DeviceConfig
	err = json.Unmarshal(data, &devices)
	if err != nil {
		return nil, err
	}

	return devices, nil
}

func SaveDevices(path string, devices []DeviceConfig) error {
	data, err := json.MarshalIndent(devices, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
