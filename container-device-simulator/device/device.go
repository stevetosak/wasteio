package device

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/stevetosak/wasteio/container-device-simulator/config"
)

type Telemetry struct {
	ContainerID string          `json:"containerId"`
	FillLevel   float64         `json:"fillLevel"`
	Battery     float64         `json:"batteryLevel"`
	Timestamp   time.Time       `json:"timestamp"`
	Location    config.Location `json:"location"`
}

type Event struct {
	ContainerID string    `json:"containerId"`
	EventType   string    `json:"eventType"`
	FillLevel   float64   `json:"fillLevel"`
	Timestamp   time.Time `json:"timestamp"`
}

type registerRequest struct {
	DeviceID          string `json:"deviceId"`
	RegistrationToken string `json:"registrationToken"`
}

type registerResponse struct {
	MqttHost       string `json:"mqttHost"`
	MqttPort       int    `json:"mqttPort"`
	MqttUsername   string `json:"mqttUsername"`
	MqttPassword   string `json:"mqttPassword"`
	TelemetryTopic string `json:"telemetryTopic"`
}

type Device struct {
	cfg       config.DeviceConfig
	fillLevel float64
	battery   float64
	client    mqtt.Client
	pickupCh  chan struct{}
}

func New(cfg config.DeviceConfig) *Device {
	return &Device{
		cfg:       cfg,
		fillLevel: rand.Float64() * 30,
		battery:   80 + rand.Float64()*20,
		pickupCh:  make(chan struct{}, 1),
	}
}

// Register calls the API to exchange a registration token for MQTT credentials.
// If the device already has credentials, it returns immediately.
func Register(cfg *config.DeviceConfig, apiBaseURL string) error {
	if cfg.MqttPassword != "" {
		return nil
	}
	if cfg.RegistrationToken == "" {
		return fmt.Errorf("[%s] no registration token set, skipping registration", cfg.ContainerID)
	}

	body, err := json.Marshal(registerRequest{
		DeviceID:          cfg.ContainerID,
		RegistrationToken: cfg.RegistrationToken,
	})
	if err != nil {
		return err
	}

	resp, err := http.Post(apiBaseURL+"/api/devices/register", "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("[%s] registration request failed: %w", cfg.ContainerID, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("[%s] registration failed (HTTP %d): %s", cfg.ContainerID, resp.StatusCode, raw)
	}

	var creds registerResponse
	if err := json.NewDecoder(resp.Body).Decode(&creds); err != nil {
		return fmt.Errorf("[%s] failed to decode registration response: %w", cfg.ContainerID, err)
	}

	cfg.MqttUsername = creds.MqttUsername
	cfg.MqttPassword = creds.MqttPassword
	cfg.RegistrationToken = ""
	fmt.Printf("[%s] registered successfully\n", cfg.ContainerID)
	return nil
}

type simRegisterRequest struct {
	DeviceID string `json:"deviceId"`
}

// SimRegister logs in as admin and calls /admin/devices/sim-register to obtain MQTT credentials.
// If the device already has credentials (loaded from disk), it returns immediately.
func SimRegister(cfg *config.DeviceConfig, apiBaseURL, adminEmail, adminPassword string) error {
	if cfg.MqttPassword != "" {
		return nil
	}

	loginURL := fmt.Sprintf("%s/auth/login?email=%s&password=%s",
		apiBaseURL, adminEmail, adminPassword)
	resp, err := http.Post(loginURL, "application/json", nil)
	if err != nil {
		return fmt.Errorf("[%s] login request failed: %w", cfg.ContainerID, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("[%s] login failed (HTTP %d): %s", cfg.ContainerID, resp.StatusCode, raw)
	}
	var loginResp struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return fmt.Errorf("[%s] failed to decode login response: %w", cfg.ContainerID, err)
	}

	body, _ := json.Marshal(simRegisterRequest{DeviceID: cfg.ContainerID})
	req, _ := http.NewRequest("POST", apiBaseURL+"/admin/devices/sim-register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+loginResp.Token)

	resp2, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("[%s] sim-register request failed: %w", cfg.ContainerID, err)
	}
	defer resp2.Body.Close()
	if resp2.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp2.Body)
		return fmt.Errorf("[%s] sim-register failed (HTTP %d): %s", cfg.ContainerID, resp2.StatusCode, raw)
	}

	var creds registerResponse
	if err := json.NewDecoder(resp2.Body).Decode(&creds); err != nil {
		return fmt.Errorf("[%s] failed to decode sim-register response: %w", cfg.ContainerID, err)
	}

	cfg.MqttUsername = creds.MqttUsername
	cfg.MqttPassword = creds.MqttPassword
	fmt.Printf("[%s] sim-registered successfully\n", cfg.ContainerID)
	return nil
}

// connect creates the MQTT client, connects to the broker, and subscribes to the commands topic.
func (d *Device) connect(brokerURL string) error {
	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID("simulator-" + d.cfg.ContainerID).
		SetCleanSession(true).
		SetAutoReconnect(true)

	if d.cfg.MqttUsername != "" {
		opts.SetUsername(d.cfg.MqttUsername)
		opts.SetPassword(d.cfg.MqttPassword)
	}

	d.client = mqtt.NewClient(opts)

	if token := d.client.Connect(); token.Wait() && token.Error() != nil {
		return token.Error()
	}

	commandTopic := fmt.Sprintf("waste/devices/%s/commands", d.cfg.ContainerID)

	token := d.client.Subscribe(commandTopic, 1, func(_ mqtt.Client, _ mqtt.Message) {
		select {
		case d.pickupCh <- struct{}{}:
		default:
		}
	})
	token.Wait()
	return token.Error()
}

func (d *Device) updateFill(snap config.ConfigSnapshot) {
	d.fillLevel += snap.FillRateMin + rand.Float64()*(snap.FillRateMax-snap.FillRateMin)
	if d.fillLevel > 100 {
		d.fillLevel = 100
	}
}

func (d *Device) updateBattery(snap config.ConfigSnapshot) {
	d.battery -= snap.BatteryDrainMin + rand.Float64()*(snap.BatteryDrainMax-snap.BatteryDrainMin)
	if d.battery < 0 {
		d.battery = 0
	}
}

func round2(f float64) float64 {
	return math.Round(f*100) / 100
}

func (d *Device) buildPayload() ([]byte, error) {
	t := Telemetry{
		ContainerID: d.cfg.ContainerID,
		FillLevel:   round2(d.fillLevel),
		Battery:     round2(d.battery),
		Timestamp:   time.Now().UTC(),
		Location:    d.cfg.Location,
	}
	return json.Marshal(t)
}

func (d *Device) publishTelemetry(topic string) {
	payload, err := d.buildPayload()
	if err != nil {
		fmt.Printf("[%s] marshal error: %v\n", d.cfg.ContainerID, err)
		return
	}
	token := d.client.Publish(topic, 0, false, payload)
	token.Wait()
	if token.Error() != nil {
		fmt.Printf("[%s] publish error: %v\n", d.cfg.ContainerID, token.Error())
		return
	}
	fmt.Printf("[%s] published: %s\n", d.cfg.ContainerID, payload)
}

func (d *Device) publishEvent(eventType string) {
	topic := fmt.Sprintf("waste/devices/%s/events", d.cfg.ContainerID)
	payload, err := json.Marshal(Event{
		ContainerID: d.cfg.ContainerID,
		EventType:   eventType,
		FillLevel:   round2(d.fillLevel),
		Timestamp:   time.Now().UTC(),
	})
	if err != nil {
		fmt.Printf("[%s] event marshal error: %v\n", d.cfg.ContainerID, err)
		return
	}
	token := d.client.Publish(topic, 1, false, payload)
	token.Wait()
	if token.Error() != nil {
		fmt.Printf("[%s] event publish error: %v\n", d.cfg.ContainerID, token.Error())
	}
}

func (d *Device) Run(ctx context.Context, brokerURL string, rtCfg *config.RuntimeConfig) {
	if err := d.connect(brokerURL); err != nil {
		fmt.Printf("[%s] failed to connect to broker: %v\n", d.cfg.ContainerID, err)
		return
	}
	defer d.client.Disconnect(250)

	telemetryTopic := fmt.Sprintf("waste/devices/%s/telemetry", d.cfg.ContainerID)

	snap := rtCfg.Snapshot()

	fmt.Printf("[%s] connected, fill=%.1f%%\n", d.cfg.ContainerID, d.fillLevel)
	d.publishTelemetry(telemetryTopic)

	select {
	case <-time.After(time.Duration(3+rand.Intn(6)) * time.Second):
	case <-ctx.Done():
		return
	}

	changes := rtCfg.Subscribe()

	fillInterval := snap.FillInterval
	batteryInterval := snap.BatteryInterval
	telemetryInterval := snap.TelemetryInterval

	fillTicker := time.NewTicker(fillInterval)
	batteryTicker := time.NewTicker(batteryInterval)
	telemetryTicker := time.NewTicker(telemetryInterval)
	defer fillTicker.Stop()
	defer batteryTicker.Stop()
	defer telemetryTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			fmt.Printf("[%s] shutting down...\n", d.cfg.ContainerID)
			return

		case <-d.pickupCh:
			d.fillLevel *= 0.15 + rand.Float64()*0.1
			fmt.Printf("[%s] pickup received, fill dropped to %.1f%%\n", d.cfg.ContainerID, d.fillLevel)
			d.publishEvent("emptied")

		case <-changes:
			snap = rtCfg.Snapshot()
			if snap.FillInterval != fillInterval {
				fillInterval = snap.FillInterval
				fillTicker.Reset(fillInterval)
			}
			if snap.BatteryInterval != batteryInterval {
				batteryInterval = snap.BatteryInterval
				batteryTicker.Reset(batteryInterval)
			}
			if snap.TelemetryInterval != telemetryInterval {
				telemetryInterval = snap.TelemetryInterval
				jitter := time.Duration(rand.Int63n(int64(telemetryInterval)))
				telemetryTicker.Reset(jitter + 1)
			}

		case <-fillTicker.C:
			snap = rtCfg.Snapshot()
			if snap.FillInterval != fillInterval {
				fillInterval = snap.FillInterval
				fillTicker.Reset(fillInterval)
			}
			d.updateFill(snap)

		case <-batteryTicker.C:
			snap = rtCfg.Snapshot()
			if snap.BatteryInterval != batteryInterval {
				batteryInterval = snap.BatteryInterval
				batteryTicker.Reset(batteryInterval)
			}
			d.updateBattery(snap)

		case <-telemetryTicker.C:
			snap = rtCfg.Snapshot()
			telemetryInterval = snap.TelemetryInterval
			telemetryTicker.Reset(telemetryInterval)
			d.publishTelemetry(telemetryTopic)
		}
	}
}
