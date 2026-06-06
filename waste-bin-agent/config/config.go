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

// LoadSimDevice derives the device ID from the container hostname and returns the config
// and the effective per-device data dir (dataDir/<deviceID>).
// On subsequent boots credentials are reloaded from that subdir if present.
func LoadSimDevice(dataDir string) (*DeviceConfig, string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return nil, "", fmt.Errorf("failed to get hostname: %w", err)
	}
	deviceID := "sim-" + hostname
	effectiveDir := filepath.Join(dataDir, deviceID)

	credPath := filepath.Join(effectiveDir, "credentials.json")
	if data, err := os.ReadFile(credPath); err == nil {
		var cfg DeviceConfig
		if err := json.Unmarshal(data, &cfg); err == nil && cfg.MqttPassword != "" {
			log.Printf("[%s] loaded credentials from %s", cfg.ContainerID, credPath)
			return &cfg, effectiveDir, nil
		}
	}

	return &DeviceConfig{ContainerID: deviceID}, effectiveDir, nil
}

// LoadOrCreate loads persisted credentials from dataDir/credentials.json if present,
// otherwise builds a config from the supplied deviceID and token.
func LoadOrCreate(deviceID, registrationToken, dataDir string) (*DeviceConfig, error) {
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

// SaveCredentials persists MQTT credentials to dataDir/credentials.json.
// The registration token is intentionally not saved — it was single-use.
func SaveCredentials(cfg *DeviceConfig, dataDir string) error {
	if cfg.MqttPassword == "" {
		return nil
	}
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return err
	}
	toSave := *cfg
	toSave.RegistrationToken = ""
	data, err := json.MarshalIndent(toSave, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dataDir, "credentials.json"), data, 0600)
}
