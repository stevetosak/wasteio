package controller

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/stevetosak/wasteio/container-device-simulator/config"
)

type payload struct {
	FillInterval      string  `json:"fillInterval"`
	BatteryInterval   string  `json:"batteryInterval"`
	TelemetryInterval string  `json:"telemetryInterval"`
	FillRateMin       float64 `json:"fillRateMin"`
	FillRateMax       float64 `json:"fillRateMax"`
	BatteryDrainMin   float64 `json:"batteryDrainMin"`
	BatteryDrainMax   float64 `json:"batteryDrainMax"`
}

func snapToPayload(s config.ConfigSnapshot) payload {
	return payload{
		FillInterval:      s.FillInterval.String(),
		BatteryInterval:   s.BatteryInterval.String(),
		TelemetryInterval: s.TelemetryInterval.String(),
		FillRateMin:       s.FillRateMin,
		FillRateMax:       s.FillRateMax,
		BatteryDrainMin:   s.BatteryDrainMin,
		BatteryDrainMax:   s.BatteryDrainMax,
	}
}

func Start(addr string, rtCfg *config.RuntimeConfig) {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /config", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snapToPayload(rtCfg.Snapshot()))
	})

	mux.HandleFunc("PUT /config", func(w http.ResponseWriter, r *http.Request) {
		var p payload
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			http.Error(w, "invalid JSON", http.StatusBadRequest)
			return
		}

		snap := rtCfg.Snapshot()

		if p.FillInterval != "" {
			d, err := time.ParseDuration(p.FillInterval)
			if err != nil || d <= 0 {
				http.Error(w, "invalid fillInterval: "+p.FillInterval, http.StatusBadRequest)
				return
			}
			snap.FillInterval = d
		}
		if p.BatteryInterval != "" {
			d, err := time.ParseDuration(p.BatteryInterval)
			if err != nil || d <= 0 {
				http.Error(w, "invalid batteryInterval: "+p.BatteryInterval, http.StatusBadRequest)
				return
			}
			snap.BatteryInterval = d
		}
		if p.TelemetryInterval != "" {
			d, err := time.ParseDuration(p.TelemetryInterval)
			if err != nil || d <= 0 {
				http.Error(w, "invalid telemetryInterval: "+p.TelemetryInterval, http.StatusBadRequest)
				return
			}
			snap.TelemetryInterval = d
		}
		if p.FillRateMin > 0 {
			snap.FillRateMin = p.FillRateMin
		}
		if p.FillRateMax > 0 {
			snap.FillRateMax = p.FillRateMax
		}
		if p.BatteryDrainMin > 0 {
			snap.BatteryDrainMin = p.BatteryDrainMin
		}
		if p.BatteryDrainMax > 0 {
			snap.BatteryDrainMax = p.BatteryDrainMax
		}

		old := rtCfg.Snapshot()
		rtCfg.Update(snap)

		log.Println("┌─ config update ───────────────────────")
		changed := false
		if old.FillInterval != snap.FillInterval {
			log.Printf("│  fillInterval:     %s → %s", old.FillInterval, snap.FillInterval)
			changed = true
		}
		if old.BatteryInterval != snap.BatteryInterval {
			log.Printf("│  batteryInterval:  %s → %s", old.BatteryInterval, snap.BatteryInterval)
			changed = true
		}
		if old.TelemetryInterval != snap.TelemetryInterval {
			log.Printf("│  telemetryInterval: %s → %s", old.TelemetryInterval, snap.TelemetryInterval)
			changed = true
		}
		if old.FillRateMin != snap.FillRateMin {
			log.Printf("│  fillRateMin:      %.2f → %.2f", old.FillRateMin, snap.FillRateMin)
			changed = true
		}
		if old.FillRateMax != snap.FillRateMax {
			log.Printf("│  fillRateMax:      %.2f → %.2f", old.FillRateMax, snap.FillRateMax)
			changed = true
		}
		if old.BatteryDrainMin != snap.BatteryDrainMin {
			log.Printf("│  batteryDrainMin:  %.2f → %.2f", old.BatteryDrainMin, snap.BatteryDrainMin)
			changed = true
		}
		if old.BatteryDrainMax != snap.BatteryDrainMax {
			log.Printf("│  batteryDrainMax:  %.2f → %.2f", old.BatteryDrainMax, snap.BatteryDrainMax)
			changed = true
		}
		if !changed {
			log.Println("│  nothing changed")
		}
		log.Println("└───────────────────────────────────────")

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snapToPayload(rtCfg.Snapshot()))
	})

	go func() {
		log.Printf("control server listening on %s", addr)
		if err := http.ListenAndServe(addr, mux); err != nil {
			log.Printf("control server error: %v", err)
		}
	}()
}
