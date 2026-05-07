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
	ContainerID string   `json:"containerId"`
	Location    Location `json:"location"`
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
