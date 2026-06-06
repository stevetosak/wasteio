package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/stevetosak/wasteio/waste-bin-agent/config"
	"github.com/stevetosak/wasteio/waste-bin-agent/device"
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
	dataDirDefault := "/app/data"
	if v := os.Getenv("DATA_DIR"); v != "" {
		dataDirDefault = v
	}

	brokerURL := flag.String("broker", brokerDefault, "MQTT broker URL")
	apiURL := flag.String("api-url", apiDefault, "Backend API base URL")
	dataDir := flag.String("data-dir", dataDirDefault, "Directory for persisting credentials")
	deviceID := flag.String("device-id", os.Getenv("DEVICE_ID"), "Token mode: device ID")
	registrationToken := flag.String("registration-token", os.Getenv("REGISTRATION_TOKEN"), "Token mode: one-time registration token")
	simMode := flag.Bool("sim-mode", os.Getenv("SIM_MODE") == "true", "Sim mode: derive device ID from hostname, register via admin JWT")
	simAdminEmail := flag.String("sim-admin-email", os.Getenv("SIM_ADMIN_EMAIL"), "Sim mode: admin email")
	simAdminPassword := flag.String("sim-admin-password", os.Getenv("SIM_ADMIN_PASSWORD"), "Sim mode: admin password")
	fillInterval := flag.Duration("fill-interval", 5*time.Minute, "how often fill level updates")
	batteryInterval := flag.Duration("battery-interval", 1*time.Hour, "how often battery drains")
	telemetryInterval := flag.Duration("telemetry-interval", 30*time.Second, "how often telemetry is published")
	fillRateMin := flag.Float64("fill-rate-min", 0.1, "min fill increase per tick (%)")
	fillRateMax := flag.Float64("fill-rate-max", 0.3, "max fill increase per tick (%)")
	batteryDrainMin := flag.Float64("battery-drain-min", 0.01, "min battery drain per tick (%)")
	batteryDrainMax := flag.Float64("battery-drain-max", 0.05, "max battery drain per tick (%)")
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

	var cfg *config.DeviceConfig
	var saveDir string

	if *simMode {
		effectiveCfg, effectiveDir, err := config.LoadSimDevice(*dataDir)
		if err != nil {
			log.Fatalf("failed to load sim device config: %v", err)
		}
		cfg = effectiveCfg
		saveDir = effectiveDir
		if err := device.SimRegister(cfg, *apiURL, *simAdminEmail, *simAdminPassword); err != nil {
			log.Fatalf("sim registration failed: %v", err)
		}
	} else {
		tokenCfg, err := config.LoadOrCreate(*deviceID, *registrationToken, *dataDir)
		if err != nil {
			log.Fatalf("failed to load device config: %v", err)
		}
		cfg = tokenCfg
		saveDir = *dataDir
		if err := device.Register(cfg, *apiURL); err != nil {
			log.Printf("registration: %v", err)
		}
	}

	if err := config.SaveCredentials(cfg, saveDir); err != nil {
		log.Printf("warning: failed to persist credentials: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		log.Println("shutdown signal received, stopping device...")
		cancel()
	}()

	d := device.New(*cfg)
	d.Run(ctx, *brokerURL, rtCfg)
	log.Println("device stopped")
}
