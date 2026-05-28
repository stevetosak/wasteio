import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import type { FillPresetId, ToolId, ForeignObject } from "../types/radar"
import {
    CW, CH, BIN_W, BIN_H, BIN_TOP,
    SA_X, SB_X, S_Y,
    FILL_PRESETS, calibrateSensor, computeSensor, fuse, hitTestObject, makeObject, isInsideBin,
} from "../lib/radarPhysics"
import { draw } from "../lib/radarDraw"

interface DragState {
    id: number
    startX: number
    startY: number
    origObj: ForeignObject
}

// Calibration only depends on module-level constants, so compute it once
const CALIB = {
    A: calibrateSensor(SA_X, S_Y, true),
    B: calibrateSensor(SB_X, S_Y, false),
}

export function useRadarSimulator() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [fillPreset, setFillPreset] = useState<FillPresetId>("50")
    const [tool, setTool] = useState<ToolId>("vslab_wide")
    const [foreignObjs, setForeignObjs] = useState<ForeignObject[]>([])
    const [hoveredId, setHoveredId] = useState<number | null>(null)
    const [dragState, setDragState] = useState<DragState | null>(null)

    const fillObj = useMemo(
        () => FILL_PRESETS.find(p => p.id === fillPreset)?.obj ?? null,
        [fillPreset],
    )

    const allObjects = useMemo(
        () => [...(fillObj ? [fillObj] : []), ...foreignObjs],
        [fillObj, foreignObjs],
    )

    // Readings are derived — compute with useMemo instead of storing as state
    const { rA, rB, fusion } = useMemo(() => {
        const readA = computeSensor(SA_X, S_Y, true,  allObjects, CALIB.A.blindZoneY)
        const readB = computeSensor(SB_X, S_Y, false, allObjects, CALIB.B.blindZoneY)
        return { rA: readA, rB: readB, fusion: fuse(readA, readB) }
    }, [allObjects])

    // Redraw canvas whenever visual state changes
    useEffect(() => {
        if (!canvasRef.current) return
        draw(canvasRef.current, allObjects, rA, rB, fusion, CALIB.A, CALIB.B, hoveredId, dragState?.id ?? null)
    }, [allObjects, rA, rB, fusion, hoveredId, dragState])

    const getCanvasXY = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect()
        const scaleX = CW / rect.width, scaleY = CH / rect.height
        return {
            cx: (e.clientX - rect.left) * scaleX,
            cy: (e.clientY - rect.top)  * scaleY,
        }
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { cx, cy } = getCanvasXY(e)

        if (dragState) {
            const dx = cx - dragState.startX
            const dy = cy - dragState.startY
            const orig = dragState.origObj

            setForeignObjs(prev => prev.map(o => {
                if (o.id !== dragState.id) return o
                const newXRel = Math.max(0.02, Math.min(0.98, orig.xRel + dx / BIN_W))

                if (o.type === "peak" && orig.type === "peak") {
                    return {
                        ...o,
                        xRel: newXRel,
                        yTipRel:  Math.max(0.01, orig.yTipRel + dy / BIN_H),
                        yBaseRel: Math.max(0.1, Math.min(0.99, orig.yBaseRel + dy / BIN_H)),
                    }
                }
                if ((o.type === "vslab" || o.type === "vslab_leaning") &&
                    (orig.type === "vslab" || orig.type === "vslab_leaning")) {
                    const newYTopRel = Math.max(0.01, Math.min(0.9, orig.yTopRel + dy / BIN_H))
                    const newYBotRel = Math.max(newYTopRel + 0.05, Math.min(0.99, orig.yBotRel + dy / BIN_H))
                    return { ...o, xRel: newXRel, yTopRel: newYTopRel, yBotRel: newYBotRel }
                }
                return o
            }))
            return
        }

        const hit = foreignObjs.find(o => hitTestObject(o, cx, cy))
        setHoveredId(hit?.id ?? null)
    }, [dragState, foreignObjs, getCanvasXY])

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const { cx, cy } = getCanvasXY(e)
        if (!isInsideBin(cx, cy)) return

        if (tool === "eraser") {
            const hit = foreignObjs.find(o => hitTestObject(o, cx, cy))
            if (hit) setForeignObjs(prev => prev.filter(o => o.id !== hit.id))
            return
        }

        const hit = foreignObjs.find(o => hitTestObject(o, cx, cy))
        if (hit) {
            setDragState({ id: hit.id, startX: cx, startY: cy, origObj: { ...hit } })
            return
        }

        const newObj = makeObject(tool, cx, cy, fillObj)
        if (newObj) setForeignObjs(prev => [...prev, newObj])
    }, [tool, foreignObjs, fillObj, getCanvasXY])

    const handleMouseUp = useCallback(() => { setDragState(null) }, [])

    const handleMouseLeave = useCallback(() => {
        setDragState(null)
        setHoveredId(null)
    }, [])

    const getCursor = (): string => {
        if (tool === "eraser") return "crosshair"
        if (dragState) return "grabbing"
        if (hoveredId) return "grab"
        return "crosshair"
    }

    const blindPct = Math.round(((CALIB.A.blindZoneY - BIN_TOP) / BIN_H) * 100)

    return {
        canvasRef,
        fillPreset, setFillPreset,
        tool, setTool,
        foreignObjs, clearObjects: () => setForeignObjs([]),
        rA, rB, fusion,
        blindPct,
        handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
        getCursor,
    }
}
