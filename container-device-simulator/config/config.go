package config

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type DeviceConfig struct {
	ContainerID       string   `json:"containerId"`
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

// LoadOrCreateSingleDevice returns a DeviceConfig for single-device mode.
// It first tries to load persisted credentials from dataDir/credentials.json.
// If none exist (first boot), it builds the config from the supplied deviceID and token.
func LoadOrCreateSingleDevice(deviceID, registrationToken, dataDir string) (*DeviceConfig, error) {
	credPath := filepath.Join(dataDir, "credentials.json")

	if data, err := os.ReadFile(credPath); err == nil {
		var cfg DeviceConfig
		if err := json.Unmarshal(data, &cfg); err == nil && cfg.MqttPassword != "" {
			log.Printf("[%s] loaded credentials from %s", cfg.ContainerID, credPath)
			return &cfg, nil
		}
	}

	return &DeviceConfig{
		ContainerID:       deviceID,
		RegistrationToken: registrationToken,
	}, nil
}

// LoadSimDevice returns a DeviceConfig for swarm/sim mode.
// On subsequent boots it reloads credentials from dataDir/credentials.json.
// On first boot it derives the device ID from the container hostname.
func LoadSimDevice(dataDir string) (*DeviceConfig, error) {
	credPath := filepath.Join(dataDir, "credentials.json")
	if data, err := os.ReadFile(credPath); err == nil {
		var cfg DeviceConfig
		if err := json.Unmarshal(data, &cfg); err == nil && cfg.MqttPassword != "" {
			log.Printf("[%s] loaded sim credentials from %s", cfg.ContainerID, credPath)
			return &cfg, nil
		}
	}

	hostname, err := os.Hostname()
	if err != nil {
		return nil, fmt.Errorf("failed to get hostname for sim device ID: %w", err)
	}
	return &DeviceConfig{
		ContainerID: "sim-" + hostname,
	}, nil
}

// SaveSingleDeviceCredentials persists MQTT credentials to dataDir/credentials.json.
// The registration token is intentionally not saved — it was single-use.
func SaveSingleDeviceCredentials(cfg *DeviceConfig, dataDir string) error {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return err
	}
	toSave := *cfg
	toSave.RegistrationToken = ""
	data, err := json.MarshalIndent(toSave, "", "  ")
	if err != nil {
		return err
	}
	credPath := filepath.Join(dataDir, "credentials.json")
	return os.WriteFile(credPath, data, 0600)
}