import type { SimObject, SensorReading, FusionResult } from "../types/radar"
import {
    CW, CH, BIN_W, BIN_H, WALL_T, BIN_LEFT, BIN_TOP,
    SA_X, SB_X, S_Y, BEAM_HALF_DEG, castRay, getSurfRelY,
} from "./radarPhysics"

export function draw(
    canvas: HTMLCanvasElement,
    objects: SimObject[],
    rA: SensorReading,
    rB: SensorReading,
    fusion: FusionResult,
    calibA: { blindZoneY: number },
    calibB: { blindZoneY: number },
    hoveredId: number | null,
    dragId: number | null,
): void {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, CW, CH)
    const binRight = BIN_LEFT + BIN_W, binBottom = BIN_TOP + BIN_H

    ctx.fillStyle = "#07090f"; ctx.fillRect(0, 0, CW, CH)
    ctx.strokeStyle = "rgba(255,255,255,0.018)"; ctx.lineWidth = 1
    for (let x = 0; x < CW; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke() }
    for (let y = 0; y < CH; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke() }

    // Walls
    ctx.fillStyle = "#111a28"
    ctx.fillRect(BIN_LEFT - WALL_T, BIN_TOP, WALL_T, BIN_H + WALL_T)
    ctx.fillRect(binRight, BIN_TOP, WALL_T, BIN_H + WALL_T)
    ctx.fillRect(BIN_LEFT - WALL_T, binBottom, BIN_W + WALL_T * 2, WALL_T)
    ctx.strokeStyle = "#1e3a55"; ctx.lineWidth = 1
    ctx.strokeRect(BIN_LEFT - WALL_T, BIN_TOP, WALL_T, BIN_H + WALL_T)
    ctx.strokeRect(binRight, BIN_TOP, WALL_T, BIN_H + WALL_T)
    ctx.strokeRect(BIN_LEFT - WALL_T, binBottom, BIN_W + WALL_T * 2, WALL_T)
    ctx.fillStyle = "#04060c"; ctx.fillRect(BIN_LEFT, BIN_TOP, BIN_W, BIN_H)

    // Blind zones
    const bzA = calibA.blindZoneY, bzB = calibB.blindZoneY
    ctx.fillStyle = "rgba(239,68,68,0.06)"
    ctx.fillRect(BIN_LEFT, BIN_TOP, BIN_W, Math.max(bzA, bzB) - BIN_TOP)
    ctx.beginPath(); ctx.moveTo(BIN_LEFT, bzA); ctx.lineTo(binRight, bzA)
    ctx.strokeStyle = "rgba(56,189,248,0.35)"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(BIN_LEFT, bzB); ctx.lineTo(binRight, bzB)
    ctx.strokeStyle = "rgba(168,85,247,0.35)"; ctx.stroke(); ctx.setLineDash([])

    // Depth markers
    ctx.font = "9px monospace"
    for (let p = 0; p <= 100; p += 25) {
        const my = BIN_TOP + (p / 100) * BIN_H
        ctx.beginPath(); ctx.moveTo(binRight + WALL_T, my); ctx.lineTo(binRight + WALL_T + 5, my)
        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1; ctx.stroke()
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillText(`${100 - p}%`, binRight + WALL_T + 8, my + 3)
    }

    // Draw fill objects
    for (const obj of objects) {
        if (obj.type !== "fill" && obj.type !== "fill_tilted") continue
        ctx.beginPath()
        ctx.moveTo(BIN_LEFT, binBottom); ctx.lineTo(binRight, binBottom)
        for (let px = BIN_W; px >= 0; px--)
            ctx.lineTo(BIN_LEFT + px, BIN_TOP + (getSurfRelY(obj, px / BIN_W) ?? 0) * BIN_H)
        ctx.closePath()
        const g = ctx.createLinearGradient(0, BIN_TOP, 0, binBottom)
        g.addColorStop(0, "rgba(52,211,153,0.2)"); g.addColorStop(1, "rgba(52,211,153,0.05)")
        ctx.fillStyle = g; ctx.fill()
        ctx.beginPath()
        for (let px = 0; px <= BIN_W; px += 2) {
            const py = BIN_TOP + (getSurfRelY(obj, px / BIN_W) ?? 0) * BIN_H
            if (px === 0) ctx.moveTo(BIN_LEFT + px, py)
            else ctx.lineTo(BIN_LEFT + px, py)
        }
        ctx.strokeStyle = "rgba(52,211,153,0.7)"; ctx.lineWidth = 1.5; ctx.stroke()
    }

    // Draw foreign objects
    for (const obj of objects) {
        const isHov = obj.type !== "fill" && obj.type !== "fill_tilted" && obj.id === hoveredId
        const isDrag = obj.type !== "fill" && obj.type !== "fill_tilted" && obj.id === dragId
        const glow = isDrag ? 1.0 : isHov ? 0.7 : 0

        if (obj.type === "vslab" || obj.type === "vslab_leaning") {
            const ax = BIN_LEFT + obj.xRel * BIN_W
            const at = BIN_TOP + obj.yTopRel * BIN_H
            const ah = (obj.yBotRel - obj.yTopRel) * BIN_H
            const lean = obj.type === "vslab_leaning" ? obj.lean : 0
            ctx.save()
            ctx.translate(ax, at + ah / 2)
            if (lean) ctx.transform(1, 0, lean, 1, 0, 0)
            if (glow > 0) { ctx.shadowColor = obj.color; ctx.shadowBlur = 12 * glow }
            ctx.fillStyle = obj.color + "55"
            ctx.strokeStyle = obj.color
            ctx.lineWidth = isDrag ? 2.5 : isHov ? 2 : 1.5
            ctx.fillRect(-obj.halfW, -ah / 2, obj.halfW * 2, ah)
            ctx.strokeRect(-obj.halfW, -ah / 2, obj.halfW * 2, ah)
            ctx.restore()
            ctx.fillStyle = obj.color; ctx.font = "9px monospace"
            ctx.fillText(obj.label, ax + obj.halfW + 5, at + 11)
        }

        if (obj.type === "peak") {
            const px = BIN_LEFT + obj.xRel * BIN_W
            const pt = BIN_TOP + obj.yTipRel * BIN_H
            const pb = BIN_TOP + obj.yBaseRel * BIN_H
            ctx.save()
            if (glow > 0) { ctx.shadowColor = obj.color; ctx.shadowBlur = 12 * glow }
            ctx.beginPath()
            ctx.moveTo(px - obj.halfW, pb); ctx.lineTo(px, pt); ctx.lineTo(px + obj.halfW, pb)
            ctx.closePath()
            ctx.fillStyle = obj.color + "44"; ctx.strokeStyle = obj.color
            ctx.lineWidth = isDrag ? 2.5 : isHov ? 2 : 1.5
            ctx.fill(); ctx.stroke()
            ctx.restore()
            ctx.fillStyle = obj.color; ctx.font = "9px monospace"
            ctx.fillText(obj.label, px + obj.halfW + 5, pt)
        }
    }

    // Beam cones
    const sensors = [
        { sx: SA_X, sy: S_Y, fr: true,  col: "56,189,248",  blind: bzA, r: rA },
        { sx: SB_X, sy: S_Y, fr: false, col: "168,85,247",  blind: bzB, r: rB },
    ]

    for (const sen of sensors) {
        const lh = castRay(sen.sx, sen.sy, -BEAM_HALF_DEG, objects, sen.fr)
        const rh = castRay(sen.sx, sen.sy,  BEAM_HALF_DEG, objects, sen.fr)
        if (lh && rh) {
            ctx.beginPath(); ctx.moveTo(sen.sx, sen.sy); ctx.lineTo(lh.x, lh.y); ctx.lineTo(rh.x, rh.y); ctx.closePath()
            const cg = ctx.createRadialGradient(sen.sx, sen.sy, 0, sen.sx, sen.sy, 330)
            cg.addColorStop(0, `rgba(${sen.col},0.1)`); cg.addColorStop(1, `rgba(${sen.col},0.01)`)
            ctx.fillStyle = cg; ctx.fill()
        }

        for (const ray of sen.r.allRays) {
            const isBlind = ray.y < sen.blind
            const isCenter = Math.abs(ray.angle ?? 0) < 0.8
            const col = isBlind ? "100,30,30"
                : ray.hit === "object" ? "239,68,68"
                    : ray.hit === "wall" ? "249,115,22"
                        : sen.col
            const op = isBlind ? (isCenter ? 0.28 : 0.07) : (isCenter ? 0.9 : 0.16)
            ctx.beginPath(); ctx.moveTo(sen.sx, sen.sy); ctx.lineTo(ray.x, ray.y)
            ctx.strokeStyle = `rgba(${col},${op})`; ctx.lineWidth = isCenter ? 2 : 0.7; ctx.stroke()
            ctx.beginPath(); ctx.arc(ray.x, ray.y, isCenter ? 4 : 1.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${col},${isBlind ? 0.18 : (isCenter ? 1 : 0.45)})`; ctx.fill()
        }

        if (sen.r.primary) {
            const lc = sen.r.primary.hit === "object" ? "#ef4444"
                : sen.r.primary.hit === "wall" ? "#f97316"
                    : `rgb(${sen.col})`
            ctx.beginPath(); ctx.moveTo(BIN_LEFT, sen.r.detectedY); ctx.lineTo(binRight, sen.r.detectedY)
            ctx.strokeStyle = lc; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([])
        }

        // Sensor chip
        ctx.beginPath(); ctx.moveTo(sen.sx, sen.sy + 8)
        if (sen.fr) { ctx.lineTo(BIN_LEFT - WALL_T - 2, sen.sy + 8); ctx.lineTo(BIN_LEFT - WALL_T - 2, BIN_TOP + 18) }
        else         { ctx.lineTo(binRight + WALL_T + 2, sen.sy + 8); ctx.lineTo(binRight + WALL_T + 2, BIN_TOP + 18) }
        ctx.strokeStyle = `rgba(${sen.col},0.28)`; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke()
        ctx.fillStyle = "#152030"; ctx.strokeStyle = `rgb(${sen.col})`; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.roundRect(sen.sx - 14, sen.sy - 14, 28, 14, 3); ctx.fill(); ctx.stroke()
        ctx.fillStyle = `rgb(${sen.col})`; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"
        ctx.fillText(`XM125-${sen.fr ? "A" : "B"}`, sen.sx, sen.sy - 18); ctx.textAlign = "left"
    }

    // Fused level
    if (rA.primary && rB.primary) {
        const fy = (rA.detectedY + rB.detectedY) / 2
        ctx.beginPath(); ctx.moveTo(BIN_LEFT, fy); ctx.lineTo(binRight, fy)
        ctx.strokeStyle = fusion.anomaly ? "rgba(239,68,68,0.8)" : "rgba(255,255,255,0.55)"
        ctx.lineWidth = 2; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([])
        ctx.fillStyle = fusion.anomaly ? "#ef4444" : "#e2e8f0"; ctx.font = "bold 9px monospace"
        ctx.fillText(
            fusion.anomaly ? `⚠ ${fusion.diff}% gap` : `min(${fusion.fusedSensor})`,
            BIN_LEFT + 4, fy - 3,
        )
    }

    ctx.fillStyle = "rgba(255,255,255,0.1)"; ctx.font = "9px monospace"
    ctx.fillText("RIM", BIN_LEFT + 4, BIN_TOP - 4)
}
