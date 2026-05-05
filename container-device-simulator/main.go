package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/stevetosak/wasteio/container-device-simulator/config"
	"github.com/stevetosak/wasteio/container-device-simulator/device"
)

func main() {
	brokerURL := "tcp://localhost:1883"

	devices, err := config.LoadDevices("devices.json")
	if err != nil {
		log.Fatalf("failed to load devices: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup

	for _, cfg := range devices {
		wg.Add(1)
		d := device.New(cfg)
		go func() {
			defer wg.Done()
			d.Run(ctx, brokerURL)
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
