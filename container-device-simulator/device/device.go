package device

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
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

// connect creates the MQTT client, connects to the broker, and subscribes to the commands topic.
// The ClientID must be unique per device — the broker uses it to identify connections.
func (d *Device) connect(brokerURL string) error {
	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID("simulator-" + d.cfg.ContainerID).
		SetCleanSession(true).
		SetAutoReconnect(true)

	d.client = mqtt.NewClient(opts)

	// Connect returns a Token — an async operation handle.
	// Wait() blocks until it completes, then we check for errors.
	if token := d.client.Connect(); token.Wait() && token.Error() != nil {
		return token.Error()
	}

	commandTopic := fmt.Sprintf("waste/containers/%s/commands", d.cfg.ContainerID)

	// Subscribe with a callback. This callback runs on a paho-managed goroutine,
	// NOT on our Run goroutine. We bridge it into pickupCh so Run handles it safely.
	token := d.client.Subscribe(commandTopic, 1, func(_ mqtt.Client, _ mqtt.Message) {
		// Non-blocking send: if a pickup is already pending we just drop the duplicate.
		select {
		case d.pickupCh <- struct{}{}:
		default:
		}
	})
	token.Wait()
	return token.Error()
}

func (d *Device) update() {
	d.fillLevel += 1.5 + rand.Float64()*2.0 // drift up 1.5–3.5% per tick
	if d.fillLevel > 100 {
		d.fillLevel = 100
	}
	d.battery -= 0.1 + rand.Float64()*0.1
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

func (d *Device) publishEvent(eventType string) {
	topic := fmt.Sprintf("waste/containers/%s/events", d.cfg.ContainerID)
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
	// QoS 1: the backend needs to receive this exactly once.
	token := d.client.Publish(topic, 1, false, payload)
	token.Wait()
	if token.Error() != nil {
		fmt.Printf("[%s] event publish error: %v\n", d.cfg.ContainerID, token.Error())
	}
}

func (d *Device) Run(ctx context.Context, brokerURL string) {
	if err := d.connect(brokerURL); err != nil {
		fmt.Printf("[%s] failed to connect to broker: %v\n", d.cfg.ContainerID, err)
		return
	}
	// Disconnect cleanly when Run exits, giving in-flight messages 250ms to flush.
	defer d.client.Disconnect(250)

	telemetryTopic := fmt.Sprintf("waste/containers/%s/telemetry", d.cfg.ContainerID)

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	fmt.Printf("[%s] connected, fill=%.1f%%\n", d.cfg.ContainerID, d.fillLevel)

	for {
		select {
		case <-ctx.Done():
			fmt.Printf("[%s] shutting down...\n", d.cfg.ContainerID)
			return

		case <-d.pickupCh:
			// Drop fill by ~80%, leaving a small residual (workers never empty perfectly).
			d.fillLevel *= 0.15 + rand.Float64()*0.1
			fmt.Printf("[%s] pickup received, fill dropped to %.1f%%\n", d.cfg.ContainerID, d.fillLevel)
			d.publishEvent("emptied")

		case <-ticker.C:
			d.update()
			payload, err := d.buildPayload()
			if err != nil {
				fmt.Printf("[%s] marshal error: %v\n", d.cfg.ContainerID, err)
				continue
			}
			// QoS 0: fire and forget. Fine for telemetry — occasional loss is acceptable.
			// retain=false: we don't want new subscribers to get a stale reading.
			token := d.client.Publish(telemetryTopic, 0, false, payload)
			token.Wait()
			if token.Error() != nil {
				fmt.Printf("[%s] publish error: %v\n", d.cfg.ContainerID, token.Error())
				continue
			}
			fmt.Printf("[%s] published: %s\n", d.cfg.ContainerID, payload)
		}
	}
}
