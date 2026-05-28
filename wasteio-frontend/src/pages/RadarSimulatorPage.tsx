import { useRadarSimulator } from "../hooks/useRadarSimulator"
import { SimCanvas } from "../components/radar/SimCanvas"
import { SimControls } from "../components/radar/SimControls"
import { SensorReadings } from "../components/radar/SensorReadings"
import { TOOLS } from "../lib/radarPhysics"

export function RadarSimulatorPage() {
    const sim = useRadarSimulator()

    return (
        <div style={{ minHeight: "100vh", background: "#07090f", color: "#e2e8f0", fontFamily: "'JetBrains Mono','Fira Code',monospace", padding: "16px", boxSizing: "border-box" }}>
            {/* Header */}
            <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 9, color: "#38bdf8", letterSpacing: 3, textTransform: "uppercase" }}>WasteIo</span>
                    <span style={{ fontSize: 9, color: "#1a2a3a" }}>//</span>
                    <span style={{ fontSize: 9, color: "#2d4050", letterSpacing: 1 }}>Interactive · Dual Sensor · Drag to place objects</span>
                </div>
                <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>XM125 Dual Sensor Simulator</h1>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#2d4050" }}>
                    Set fill level · pick a tool · click or drag objects into the bin · watch sensors react in real time
                </p>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
                <SimControls
                    fillPreset={sim.fillPreset}
                    onFillChange={sim.setFillPreset}
                    tool={sim.tool}
                    onToolChange={sim.setTool}
                    onClear={sim.clearObjects}
                    blindPct={sim.blindPct}
                />

                <SimCanvas
                    canvasRef={sim.canvasRef}
                    cursor={sim.getCursor()}
                    toolLabel={TOOLS.find(t => t.id === sim.tool)?.label ?? ""}
                    isEraser={sim.tool === "eraser"}
                    onMouseDown={sim.handleMouseDown}
                    onMouseMove={sim.handleMouseMove}
                    onMouseUp={sim.handleMouseUp}
                    onMouseLeave={sim.handleMouseLeave}
                />

                <SensorReadings
                    rA={sim.rA}
                    rB={sim.rB}
                    fusion={sim.fusion}
                    fillPreset={sim.fillPreset}
                    foreignObjsLength={sim.foreignObjs.length}
                    tool={sim.tool}
                />
            </div>
        </div>
    )
}
