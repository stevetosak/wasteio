import type { FillPresetId, ToolId } from "../../types/radar"
import { FILL_PRESETS, TOOLS, DISAGREE_THRESH } from "../../lib/radarPhysics"

interface Props {
    fillPreset: FillPresetId
    onFillChange: (id: FillPresetId) => void
    tool: ToolId
    onToolChange: (id: ToolId) => void
    onClear: () => void
    blindPct: number
}

const LEGEND = [
    { c: "#38bdf8",             l: "Sensor A (cyan)" },
    { c: "#a855f7",             l: "Sensor B (purple)" },
    { c: "#f1f5f9",             l: "Fused level" },
    { c: "#ef4444",             l: "Object hit / anomaly" },
    { c: "#f97316",             l: "Wall hit" },
    { c: "#34d399",             l: "Fill surface" },
    { c: "rgba(239,68,68,0.3)", l: "Blind zone" },
]

export function SimControls({ fillPreset, onFillChange, tool, onToolChange, onClear, blindPct }: Props) {
    return (
        <div style={{ width: 180, flexShrink: 0 }}>
            {/* Fill level */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "#2d4050", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Fill Level</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {FILL_PRESETS.map(p => (
                        <button key={p.id} onClick={() => onFillChange(p.id)} style={{
                            background: fillPreset === p.id ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${fillPreset === p.id ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.07)"}`,
                            borderRadius: 5, padding: "4px 8px", cursor: "pointer",
                            color: fillPreset === p.id ? "#34d399" : "#3a5570", fontSize: 10,
                        }}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tool selector */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "#2d4050", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Place Object</div>
                {TOOLS.map(t => (
                    <button key={t.id} onClick={() => onToolChange(t.id)} style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%", marginBottom: 3,
                        background: tool === t.id ? `rgba(${t.id === "eraser" ? "239,68,68" : "251,191,36"},0.1)` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${tool === t.id ? (t.id === "eraser" ? "rgba(239,68,68,0.4)" : "rgba(251,191,36,0.4)") : "rgba(255,255,255,0.05)"}`,
                        borderRadius: 5, padding: "6px 10px", cursor: "pointer", textAlign: "left",
                    }}>
                        <span style={{ fontSize: 14, color: t.color, width: 16, textAlign: "center" }}>{t.icon}</span>
                        <div>
                            <div style={{ fontSize: 10, color: tool === t.id ? t.color : "#3a5570" }}>{t.label}</div>
                            <div style={{ fontSize: 8, color: "#2d4050" }}>{t.desc}</div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Clear */}
            <button onClick={onClear} style={{
                display: "block", width: "100%", padding: "6px 0", marginBottom: 12,
                background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 5, cursor: "pointer", color: "rgba(239,68,68,0.7)", fontSize: 10,
            }}>
                Clear all objects
            </button>

            {/* Calibration info */}
            <div style={{ padding: "9px 11px", background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 7, marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: "rgba(239,68,68,0.5)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Calibration</div>
                <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.8 }}>
                    <div>Blind zone: <span style={{ color: "#ef4444" }}>{blindPct}%</span></div>
                    <div>Disagree &gt;{DISAGREE_THRESH}%: <span style={{ color: "#f97316" }}>anomaly</span></div>
                </div>
            </div>

            {/* Legend */}
            <div style={{ padding: "9px 11px", background: "rgba(255,255,255,0.02)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 9, color: "#2d4050", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>Legend</div>
                {LEGEND.map(x => (
                    <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c, border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }} />
                        <span style={{ fontSize: 9, color: "#3a5570" }}>{x.l}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
