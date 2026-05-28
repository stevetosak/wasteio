import type { SensorReading, FusionResult, FillPresetId, ToolId } from "../../types/radar"
import { TOOLS } from "../../lib/radarPhysics"

interface Props {
    rA: SensorReading
    rB: SensorReading
    fusion: FusionResult
    fillPreset: FillPresetId
    foreignObjsLength: number
    tool: ToolId
}

export function SensorReadings({ rA, rB, fusion, fillPreset, foreignObjsLength, tool }: Props) {
    const sensors = [
        { label: "Sensor A", value: rA.fillPct, color: rA.primary?.hit === "object" ? "#ef4444" : "#38bdf8", hit: rA.primary?.hit },
        { label: "Sensor B", value: rB.fillPct, color: rB.primary?.hit === "object" ? "#ef4444" : "#a855f7", hit: rB.primary?.hit },
    ]

    return (
        <div style={{ width: 155, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "#2d4050", letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Output</div>

            {sensors.map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${item.color}33`, borderRadius: 8, padding: 11, marginBottom: 7 }}>
                    <div style={{ fontSize: 9, color: item.color + "88", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: item.color }}>
                        {item.value}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span>
                    </div>
                    <div style={{ marginTop: 5, height: 3, background: "#0d1117", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.value}%`, background: item.color, borderRadius: 2, transition: "width 0.2s" }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#2d4050", marginTop: 3 }}>
                        hit: <span style={{ color: item.hit === "object" ? "#ef4444" : item.hit === "wall" ? "#f97316" : item.color }}>{item.hit ?? "—"}</span>
                    </div>
                </div>
            ))}

            {/* Fused */}
            <div style={{
                background: fusion.anomaly ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${fusion.anomaly ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 8, padding: 11, marginBottom: 7,
            }}>
                <div style={{ fontSize: 9, color: fusion.anomaly ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.25)", marginBottom: 4 }}>
                    {fusion.anomaly ? `⚠ min(${fusion.fusedSensor})` : `min(${fusion.fusedSensor})`}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: fusion.anomaly ? "#ef4444" : "#f1f5f9" }}>
                    {fusion.fused}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span>
                </div>
                <div style={{ marginTop: 5, height: 3, background: "#0d1117", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${fusion.fused}%`, background: fusion.anomaly ? "#ef4444" : "#e2e8f0", borderRadius: 2, transition: "width 0.2s" }} />
                </div>
                <div style={{ fontSize: 9, color: fusion.anomaly ? "#ef4444" : "#2d4050", marginTop: 3 }}>
                    gap: {fusion.diff}% {fusion.anomaly ? "⚠" : "✓"}
                </div>
            </div>

            {/* Scene info */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: 11 }}>
                <div style={{ fontSize: 9, color: "#2d4050", marginBottom: 4 }}>Scene</div>
                <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.9 }}>
                    <div>Fill: <span style={{ color: "#34d399" }}>{fillPreset}</span></div>
                    <div>Objects: <span style={{ color: "#fbbf24" }}>{foreignObjsLength}</span></div>
                    <div>Mode: <span style={{ color: "#94a3b8" }}>{TOOLS.find(t => t.id === tool)?.label}</span></div>
                </div>
            </div>
        </div>
    )
}
