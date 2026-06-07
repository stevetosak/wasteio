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
	mu      sync.RWMutex
	cfg     ConfigSnapshot
	changes chan struct{}
}

func NewRuntimeConfig(snap ConfigSnapshot) *RuntimeConfig {
	return &RuntimeConfig{
		cfg:     snap,
		changes: make(chan struct{}, 1),
	}
}

func (rc *RuntimeConfig) Snapshot() ConfigSnapshot {
	rc.mu.RLock()
	defer rc.mu.RUnlock()
	return rc.cfg
}

func (rc *RuntimeConfig) Update(snap ConfigSnapshot) {
	rc.mu.Lock()
	rc.cfg = snap
	rc.mu.Unlock()
	select {
	case rc.changes <- struct{}{}:
	default:
	}
}

// Changes returns the notification channel. The device reads from it to know
// when to re-snapshot and reset its tickers.
func (rc *RuntimeConfig) Changes() <-chan struct{} {
	return rc.changes
}
