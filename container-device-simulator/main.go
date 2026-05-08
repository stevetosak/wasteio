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
	brokerURL := flag.String("broker", "tcp://localhost:1883", "MQTT broker URL")
	fillInterval := flag.Duration("fill-interval", 5*time.Second, "how often fill level updates")
	batteryInterval := flag.Duration("battery-interval", 30*time.Second, "how often battery drains")
	telemetryInterval := flag.Duration("telemetry-interval", 10*time.Second, "how often telemetry is published")
	fillRateMin := flag.Float64("fill-rate-min", 1.5, "min fill increase per tick (%)")
	fillRateMax := flag.Float64("fill-rate-max", 3.5, "max fill increase per tick (%)")
	batteryDrainMin := flag.Float64("battery-drain-min", 0.1, "min battery drain per tick (%)")
	batteryDrainMax := flag.Float64("battery-drain-max", 0.2, "max battery drain per tick (%)")
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

	devices, err := config.LoadDevices("devices.json")
	if err != nil {
		log.Fatalf("failed to load devices: %v", err)
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
