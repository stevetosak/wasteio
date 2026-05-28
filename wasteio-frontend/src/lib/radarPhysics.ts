import type {
    AnyFillObject, ForeignObject, SimObject,
    RayHit, SensorReading, FusionResult,
    FillPreset, ToolDef, CalibData, PeakObject,
} from "../types/radar"

// ─── Layout constants ─────────────────────────────────────────────────────────
export const CW = 500
export const CH = 420
export const BIN_W = 220
export const BIN_H = 300
export const WALL_T = 8
export const BIN_LEFT = 120
export const BIN_TOP = 70
export const SA_X = BIN_LEFT
export const SB_X = BIN_LEFT + BIN_W
export const S_Y = BIN_TOP - 22
export const BEAM_HALF_DEG = 14
export const DISAGREE_THRESH = 20

// ─── Fill presets ─────────────────────────────────────────────────────────────
export const FILL_PRESETS: FillPreset[] = [
    { id: "empty",  label: "Empty",   obj: null },
    { id: "25",     label: "25%",     obj: { type: "fill", yRel: 0.75, roughness: 10 } },
    { id: "50",     label: "50%",     obj: { type: "fill", yRel: 0.50, roughness: 13 } },
    { id: "75",     label: "75%",     obj: { type: "fill", yRel: 0.25, roughness: 9  } },
    { id: "85",     label: "85%",     obj: { type: "fill", yRel: 0.15, roughness: 7  } },
    { id: "tiltL",  label: "Tilt ←",  obj: { type: "fill_tilted", yLeftRel: 0.2,  yRightRel: 0.65, roughness: 8 } },
    { id: "tiltR",  label: "Tilt →",  obj: { type: "fill_tilted", yLeftRel: 0.65, yRightRel: 0.2,  roughness: 8 } },
]

// ─── Tool definitions ─────────────────────────────────────────────────────────
export const TOOLS: ToolDef[] = [
    { id: "vslab_wide",    label: "Cardboard",  icon: "▬", color: "#fbbf24", desc: "Wide flat sheet, strong reflector" },
    { id: "vslab_thin",    label: "Stick",       icon: "|", color: "#fb923c", desc: "Thin vertical rod or umbrella"    },
    { id: "vslab_leaning", label: "Lean board",  icon: "╱", color: "#f472b6", desc: "Leaning plank against a wall"    },
    { id: "peak",          label: "Bag peak",    icon: "△", color: "#34d399", desc: "Tall peaked garbage bag"         },
    { id: "eraser",        label: "Remove",      icon: "✕", color: "#ef4444", desc: "Click an object to remove it"    },
]

// ─── Surface helper ───────────────────────────────────────────────────────────
export function getSurfRelY(obj: AnyFillObject, relX: number): number | null {
    if (obj.type === "fill") {
        const w = obj.roughness / BIN_H
        return obj.yRel + Math.sin(relX * 12) * w + Math.cos(relX * 7) * w * 0.5
    }
    if (obj.type === "fill_tilted") {
        const base = obj.yLeftRel + (obj.yRightRel - obj.yLeftRel) * relX
        return base + Math.sin(relX * 10) * (obj.roughness / BIN_H)
    }
    return null
}

// ─── Ray caster ───────────────────────────────────────────────────────────────
export function castRay(
    sx: number, sy: number, angleDeg: number,
    objects: SimObject[], facingRight: boolean,
): RayHit | null {
    const sign = facingRight ? 1 : -1
    const rad = angleDeg * Math.PI / 180
    const ddx = sign * Math.sin(rad), ddy = Math.cos(rad)
    const binRight = BIN_LEFT + BIN_W, binBottom = BIN_TOP + BIN_H
    const STEPS = 800, MAX_T = 700

    for (let i = 1; i <= STEPS; i++) {
        const t = (i / STEPS) * MAX_T
        const rx = sx + ddx * t, ry = sy + ddy * t
        if (ry < BIN_TOP) continue
        if (rx <= BIN_LEFT && ry >= BIN_TOP)
            return { x: BIN_LEFT, y: ry, t, hit: "wall", side: facingRight ? "near" : "far" }
        if (rx >= binRight && ry >= BIN_TOP)
            return { x: binRight, y: ry, t, hit: "wall", side: facingRight ? "far" : "near" }
        if (ry >= binBottom && rx >= BIN_LEFT && rx <= binRight)
            return { x: rx, y: binBottom, t, hit: "floor" }
        if (rx < BIN_LEFT || rx > binRight) continue

        const relX = (rx - BIN_LEFT) / BIN_W, relY = (ry - BIN_TOP) / BIN_H
        for (const obj of objects) {
            if (obj.type === "fill" || obj.type === "fill_tilted") {
                const s = getSurfRelY(obj, relX)
                if (s !== null && relY >= s) return { x: rx, y: ry, t, hit: "fill" }
            }
            if (obj.type === "vslab") {
                const ax = BIN_LEFT + obj.xRel * BIN_W
                const at = BIN_TOP + obj.yTopRel * BIN_H, ab = BIN_TOP + obj.yBotRel * BIN_H
                if (Math.abs(rx - ax) <= obj.halfW && ry >= at && ry <= ab)
                    return { x: rx, y: ry, t, hit: "object", id: obj.id }
            }
            if (obj.type === "vslab_leaning") {
                const ax = BIN_LEFT + obj.xRel * BIN_W
                const at = BIN_TOP + obj.yTopRel * BIN_H, ab = BIN_TOP + obj.yBotRel * BIN_H
                const midY = (at + ab) / 2
                const offsetX = obj.lean * (ry - midY)
                if (Math.abs(rx - ax - offsetX) <= obj.halfW && ry >= at && ry <= ab)
                    return { x: rx, y: ry, t, hit: "object", id: obj.id }
            }
            if (obj.type === "peak") {
                const px = BIN_LEFT + obj.xRel * BIN_W
                const pt = BIN_TOP + obj.yTipRel * BIN_H, pb = BIN_TOP + obj.yBaseRel * BIN_H
                const dist = Math.abs(rx - px)
                if (dist <= obj.halfW) {
                    const slope = (pb - pt) / obj.halfW
                    const peakY = pt + dist * slope
                    if (ry >= peakY && ry <= pb + 5) return { x: rx, y: ry, t, hit: "fill" }
                }
            }
        }
    }
    return null
}

// ─── Calibrate ────────────────────────────────────────────────────────────────
export function calibrateSensor(sx: number, sy: number, facingRight: boolean): CalibData {
    let maxY = sy
    for (let a = -BEAM_HALF_DEG; a <= BEAM_HALF_DEG; a++) {
        const h = castRay(sx, sy, a, [], facingRight)
        if (h?.side === "near" && h.y > maxY) maxY = h.y
    }
    return { blindZoneY: maxY + 14 }
}

// ─── Sensor reading ───────────────────────────────────────────────────────────
export function computeSensor(
    sx: number, sy: number, facingRight: boolean,
    objects: SimObject[], blindZoneY: number,
): SensorReading {
    const allRays: RayHit[] = []
    for (let a = -BEAM_HALF_DEG; a <= BEAM_HALF_DEG; a += 1.5) {
        const h = castRay(sx, sy, a, objects, facingRight)
        if (h) allRays.push({ angle: a, ...h })
    }
    const blindRays = allRays.filter(r => r.y < blindZoneY)
    const validRays = allRays.filter(r => r.y >= blindZoneY)
    const primary = [...validRays].sort((a, b) => a.t - b.t)[0] ?? null
    let fillPct = 0, detectedY = BIN_TOP + BIN_H
    if (primary) {
        detectedY = primary.y
        const vh = (BIN_TOP + BIN_H) - blindZoneY
        fillPct = Math.round(Math.max(0, Math.min(100, (1 - (primary.y - blindZoneY) / vh) * 100)))
    }
    return { fillPct, allRays, blindRays, validRays, primary, detectedY }
}

// ─── Fusion ───────────────────────────────────────────────────────────────────
export function fuse(rA: SensorReading, rB: SensorReading): FusionResult {
    const diff = Math.abs(rA.fillPct - rB.fillPct)
    const anomaly = diff > DISAGREE_THRESH
    const fused = Math.min(rA.fillPct, rB.fillPct)
    const fusedSensor = rA.fillPct <= rB.fillPct ? "A" : "B"
    return { fused, diff, anomaly, fusedSensor }
}

// ─── Hit test ────────────────────────────────────────────────────────────────
export function hitTestObject(obj: ForeignObject, cx: number, cy: number): boolean {
    if (obj.type === "vslab" || obj.type === "vslab_leaning") {
        const ax = BIN_LEFT + obj.xRel * BIN_W
        const at = BIN_TOP + obj.yTopRel * BIN_H
        const ab = BIN_TOP + obj.yBotRel * BIN_H
        return cx >= ax - obj.halfW - 8 && cx <= ax + obj.halfW + 8 && cy >= at && cy <= ab
    }
    if (obj.type === "peak") {
        const px = BIN_LEFT + obj.xRel * BIN_W
        const pt = BIN_TOP + obj.yTipRel * BIN_H
        const pb = BIN_TOP + obj.yBaseRel * BIN_H
        return Math.abs(cx - px) <= obj.halfW + 8 && cy >= pt - 8 && cy <= pb + 8
    }
    return false
}

// ─── Make object ─────────────────────────────────────────────────────────────
let objCounter = 0

export function makeObject(
    toolId: string, cx: number, cy: number,
    fillObj: AnyFillObject | null,
): ForeignObject | null {
    const id = ++objCounter
    const relX = Math.max(0.05, Math.min(0.95, (cx - BIN_LEFT) / BIN_W))
    const relY = Math.max(0.02, Math.min(0.95, (cy - BIN_TOP) / BIN_H))
    const fillSurfRelY = fillObj ? (getSurfRelY(fillObj, relX) ?? 1.0) : 1.0
    const yBotRel = Math.min(fillSurfRelY, 0.98)
    const yTopRel = Math.max(0.02, relY)
    const safeTop = Math.min(yTopRel, yBotRel - 0.05)

    if (toolId === "vslab_wide")
        return { id, type: "vslab", xRel: relX, yTopRel: safeTop, yBotRel, halfW: 5, label: "Cardboard", color: "#fbbf24" }
    if (toolId === "vslab_thin")
        return { id, type: "vslab", xRel: relX, yTopRel: safeTop, yBotRel, halfW: 2, label: "Stick", color: "#fb923c" }
    if (toolId === "vslab_leaning")
        return { id, type: "vslab_leaning", xRel: relX, yTopRel: safeTop, yBotRel, halfW: 4, lean: 0.15, label: "Lean board", color: "#f472b6" }
    if (toolId === "peak") {
        const peak: PeakObject = {
            id, type: "peak", xRel: relX,
            yTipRel: Math.max(0.02, relY - 0.15),
            yBaseRel: Math.min(fillSurfRelY, yBotRel),
            halfW: 40, label: "Bag peak", color: "#34d399",
        }
        return peak
    }
    return null
}

// ─── Bin boundary ────────────────────────────────────────────────────────────
export function isInsideBin(cx: number, cy: number): boolean {
    return cx >= BIN_LEFT && cx <= BIN_LEFT + BIN_W && cy >= BIN_TOP && cy <= BIN_TOP + BIN_H
}
