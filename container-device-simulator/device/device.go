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

func (d *Device) Run(ctx context.Context, brokerURL string, rtCfg *config.RuntimeConfig) {
	if err := d.connect(brokerURL); err != nil {
		fmt.Printf("[%s] failed to connect to broker: %v\n", d.cfg.ContainerID, err)
		return
	}
	// Disconnect cleanly when Run exits, giving in-flight messages 250ms to flush.
	defer d.client.Disconnect(250)

	telemetryTopic := fmt.Sprintf("waste/containers/%s/telemetry", d.cfg.ContainerID)

	snap := rtCfg.Snapshot()

	// Publish current state immediately so the backend has data before the jitter delay.
	fmt.Printf("[%s] connected, fill=%.1f%%\n", d.cfg.ContainerID, d.fillLevel)
	d.publishTelemetry(telemetryTopic)

	// Random offset (1–3s) so devices don't all fire their tickers at the same time.
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
			// Drop fill by ~80%, leaving a small residual (workers never empty perfectly).
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
				// All devices receive this signal simultaneously, so a plain Reset would
				// re-synchronize all 20 tickers. Use a random offset within the new interval
				// so they spread back out. The tick handler always resets to the true interval,
				// so the period self-corrects after this one jittered first fire.
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
			// Always reset to the current interval so the period self-corrects after a
			// jittered reset from a config change.
			telemetryInterval = snap.TelemetryInterval
			telemetryTicker.Reset(telemetryInterval)
			// QoS 0: fire and forget. Fine for telemetry — occasional loss is acceptable.
			// retain=false: we don't want new subscribers to get a stale reading.
			d.publishTelemetry(telemetryTopic)
		}
	}
}
