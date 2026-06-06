package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/stevetosak/wasteio/container-device-simulator/config"
	"github.com/stevetosak/wasteio/container-device-simulator/controller"
	"github.com/stevetosak/wasteio/container-device-simulator/device"
)

func main() {
	brokerDefault := "tcp://localhost:1883"
	if v := os.Getenv("MQTT_BROKER_URL"); v != "" {
		brokerDefault = v
	}
	apiDefault := "http://localhost:8080"
	if v := os.Getenv("API_BASE_URL"); v != "" {
		apiDefault = v
	}
	devicesPathDefault := "devices.json"
	if v := os.Getenv("DEVICES_PATH"); v != "" {
		devicesPathDefault = v
	}

	brokerURL := flag.String("broker", brokerDefault, "MQTT broker URL")
	apiURL := flag.String("api-url", apiDefault, "Backend API base URL (used for device registration)")
	devicesPath := flag.String("devices", devicesPathDefault, "Path to devices.json")
	fillInterval := flag.Duration("fill-interval", 5*time.Minute, "how often fill level updates")
	batteryInterval := flag.Duration("battery-interval", 1*time.Hour, "how often battery drains")
	telemetryInterval := flag.Duration("telemetry-interval", 30*time.Second, "how often telemetry is published")
	fillRateMin := flag.Float64("fill-rate-min", 0.1, "min fill increase per tick (%)")
	fillRateMax := flag.Float64("fill-rate-max", 0.3, "max fill increase per tick (%)")
	batteryDrainMin := flag.Float64("battery-drain-min", 0.01, "min battery drain per tick (%)")
	batteryDrainMax := flag.Float64("battery-drain-max", 0.05, "max battery drain per tick (%)")
	controlAddr := flag.String("control-addr", ":8090", "address for the control HTTP server")
	flag.Parse()

	rtCfg := config.NewRuntimeConfig(config.ConfigSnapshot{
		FillInterval:      *fillInterval,
		BatteryInterval:   *batteryInterval,
		TelemetryInterval: *telemetryInterval,
		FillRateMin:       *fillRateMin,
		FillRateMax:       *fillRateMax,
		BatteryDrainMin:   *batteryDrainMin,
		BatteryDrainMax:   *batteryDrainMax,
	})

	devices, err := config.LoadDevices(*devicesPath)
	if err != nil {
		log.Fatalf("failed to load devices: %v", err)
	}

	credentialsDirty := false
	for i := range devices {
		if err := device.Register(&devices[i], *apiURL); err != nil {
			log.Printf("registration failed for %s: %v", devices[i].ContainerID, err)
		} else if devices[i].MqttUsername != "" {
			credentialsDirty = true
		}
	}

	if credentialsDirty {
		if err := config.SaveDevices(*devicesPath, devices); err != nil {
			log.Printf("warning: failed to persist credentials to %s: %v", *devicesPath, err)
		} else {
			log.Printf("credentials persisted to %s", *devicesPath)
		}
	}

	controller.Start(*controlAddr, rtCfg)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup

	for _, cfg := range devices {
		wg.Add(1)
		d := device.New(cfg)
		go func() {
			defer wg.Done()
			d.Run(ctx, *brokerURL, rtCfg)
		}()
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutdown signal received, stopping devices...")
	cancel()
	wg.Wait()
	log.Println("all devices stopped")
}
