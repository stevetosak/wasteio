package config

import (
	"sync"
	"time"
)

type ConfigSnapshot struct {
	FillInterval      time.Duration
	BatteryInterval   time.Duration
	TelemetryInterval time.Duration
	FillRateMin       float64
	FillRateMax       float64
	BatteryDrainMin   float64
	BatteryDrainMax   float64
}

type RuntimeConfig struct {
	mu       sync.RWMutex
	cfg      ConfigSnapshot
	watchers []chan struct{}
}

func NewRuntimeConfig(snap ConfigSnapshot) *RuntimeConfig {
	return &RuntimeConfig{cfg: snap}
}

func (rc *RuntimeConfig) Snapshot() ConfigSnapshot {
	rc.mu.RLock()
	defer rc.mu.RUnlock()
	return rc.cfg
}

func (rc *RuntimeConfig) Update(snap ConfigSnapshot) {
	rc.mu.Lock()
	defer rc.mu.Unlock()
	rc.cfg = snap
	for _, ch := range rc.watchers {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

// Subscribe returns a per-device channel that receives a notification on
// every Update. Each device must call Subscribe to get its own channel —
// a shared channel would only deliver each notification to one device.
func (rc *RuntimeConfig) Subscribe() <-chan struct{} {
	ch := make(chan struct{}, 1)
	rc.mu.Lock()
	rc.watchers = append(rc.watchers, ch)
	rc.mu.Unlock()
	return ch
}
