export type FillPresetId = "empty" | "25" | "50" | "75" | "85" | "tiltL" | "tiltR"
export type ToolId = "vslab_wide" | "vslab_thin" | "vslab_leaning" | "peak" | "eraser"
export type HitType = "fill" | "wall" | "floor" | "object"

export interface FillObject {
    type: "fill"
    yRel: number
    roughness: number
}

export interface FillTiltedObject {
    type: "fill_tilted"
    yLeftRel: number
    yRightRel: number
    roughness: number
}

export type AnyFillObject = FillObject | FillTiltedObject

export interface VslabObject {
    id: number
    type: "vslab"
    xRel: number
    yTopRel: number
    yBotRel: number
    halfW: number
    label: string
    color: string
}

export interface VslabLeaningObject {
    id: number
    type: "vslab_leaning"
    xRel: number
    yTopRel: number
    yBotRel: number
    halfW: number
    lean: number
    label: string
    color: string
}

export interface PeakObject {
    id: number
    type: "peak"
    xRel: number
    yTipRel: number
    yBaseRel: number
    halfW: number
    label: string
    color: string
}

export type ForeignObject = VslabObject | VslabLeaningObject | PeakObject
export type SimObject = AnyFillObject | ForeignObject

export interface RayHit {
    x: number
    y: number
    t: number
    hit: HitType
    side?: "near" | "far"
    id?: number
    angle?: number
}

export interface SensorReading {
    fillPct: number
    allRays: RayHit[]
    blindRays: RayHit[]
    validRays: RayHit[]
    primary: RayHit | null
    detectedY: number
}

export interface FusionResult {
    fused: number
    diff: number
    anomaly: boolean
    fusedSensor: "A" | "B"
}

export interface CalibData {
    blindZoneY: number
}

export interface FillPreset {
    id: FillPresetId
    label: string
    obj: AnyFillObject | null
}

export interface ToolDef {
    id: ToolId
    label: string
    icon: string
    color: string
    desc: string
}
