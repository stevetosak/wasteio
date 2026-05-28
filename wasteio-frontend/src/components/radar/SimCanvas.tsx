import type { RefObject, MouseEventHandler } from "react"
import { CW, CH } from "../../lib/radarPhysics"

interface Props {
    canvasRef: RefObject<HTMLCanvasElement | null>
    cursor: string
    toolLabel: string
    isEraser: boolean
    onMouseDown: MouseEventHandler<HTMLCanvasElement>
    onMouseMove: MouseEventHandler<HTMLCanvasElement>
    onMouseUp: MouseEventHandler<HTMLCanvasElement>
    onMouseLeave: MouseEventHandler<HTMLCanvasElement>
}

export function SimCanvas({ canvasRef, cursor, toolLabel, isEraser, onMouseDown, onMouseMove, onMouseUp, onMouseLeave }: Props) {
    return (
        <div style={{ flex: "1 1 300px" }}>
            <canvas
                ref={canvasRef}
                width={CW} height={CH}
                style={{
                    borderRadius: 9, border: "1px solid rgba(56,189,248,0.1)",
                    display: "block", background: "#07090f", width: "100%", maxWidth: CW, cursor,
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
            />
            <div style={{ marginTop: 7, padding: "6px 11px", background: "rgba(56,189,248,0.03)", border: "1px solid rgba(56,189,248,0.07)", borderRadius: 6, fontSize: 10, color: "#2d4050" }}>
                {isEraser
                    ? "Click on any object to remove it"
                    : `Selected: ${toolLabel} — click inside bin to place · drag existing objects to reposition`}
            </div>
        </div>
    )
}
