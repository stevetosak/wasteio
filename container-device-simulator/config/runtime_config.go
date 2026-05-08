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
	mu  sync.RWMutex
	cfg ConfigSnapshot
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
}
