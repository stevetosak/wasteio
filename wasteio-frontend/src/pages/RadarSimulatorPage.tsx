import { useState, useRef, useEffect, useCallback } from "react";

// ─── Layout constants ─────────────────────────────────────────────────────────
const CW = 500, CH = 420;
const BIN_W = 220, BIN_H = 300, WALL_T = 8;
const BIN_LEFT = 120, BIN_TOP = 70;
const SA_X = BIN_LEFT, SB_X = BIN_LEFT + BIN_W, S_Y = BIN_TOP - 22;
const BEAM_HALF_DEG = 14;
const DISAGREE_THRESH = 20;

// ─── Fill presets ─────────────────────────────────────────────────────────────
const FILL_PRESETS = [
    { id: "empty",  label: "Empty",   obj: null },
    { id: "25",     label: "25%",     obj: { type: "fill", yRel: 0.75, roughness: 10 } },
    { id: "50",     label: "50%",     obj: { type: "fill", yRel: 0.50, roughness: 13 } },
    { id: "75",     label: "75%",     obj: { type: "fill", yRel: 0.25, roughness: 9  } },
    { id: "85",     label: "85%",     obj: { type: "fill", yRel: 0.15, roughness: 7  } },
    { id: "tiltL",  label: "Tilt ←",  obj: { type: "fill_tilted", yLeftRel: 0.2, yRightRel: 0.65, roughness: 8 } },
    { id: "tiltR",  label: "Tilt →",  obj: { type: "fill_tilted", yLeftRel: 0.65, yRightRel: 0.2, roughness: 8 } },
];

// Foreign object tools the user can place
const TOOLS = [
    { id: "vslab_wide",   label: "Cardboard",   icon: "▬", color: "#fbbf24", desc: "Wide flat sheet, strong reflector" },
    { id: "vslab_thin",   label: "Stick",        icon: "|", color: "#fb923c", desc: "Thin vertical rod or umbrella"    },
    { id: "vslab_leaning",label: "Lean board",   icon: "╱", color: "#f472b6", desc: "Leaning plank against a wall"    },
    { id: "peak",         label: "Bag peak",     icon: "△", color: "#34d399", desc: "Tall peaked garbage bag"         },
    { id: "eraser",       label: "Remove",       icon: "✕", color: "#ef4444", desc: "Click an object to remove it"    },
];

// ─── Surface helper ───────────────────────────────────────────────────────────
function getSurfRelY(obj, relX) {
    if (obj.type === "fill") {
        const w = obj.roughness / BIN_H;
        return obj.yRel + Math.sin(relX * 12) * w + Math.cos(relX * 7) * w * 0.5;
    }
    if (obj.type === "fill_tilted") {
        const base = obj.yLeftRel + (obj.yRightRel - obj.yLeftRel) * relX;
        return base + Math.sin(relX * 10) * (obj.roughness / BIN_H);
    }
    return null;
}

// ─── Ray caster ───────────────────────────────────────────────────────────────
function castRay(sx, sy, angleDeg, objects, facingRight) {
    const sign = facingRight ? 1 : -1;
    const rad = angleDeg * Math.PI / 180;
    const ddx = sign * Math.sin(rad), ddy = Math.cos(rad);
    const binRight = BIN_LEFT + BIN_W, binBottom = BIN_TOP + BIN_H;
    const STEPS = 800, MAX_T = 700;

    for (let i = 1; i <= STEPS; i++) {
        const t = (i / STEPS) * MAX_T;
        const rx = sx + ddx * t, ry = sy + ddy * t;
        if (ry < BIN_TOP) continue;
        if (rx <= BIN_LEFT && ry >= BIN_TOP) return { x: BIN_LEFT, y: ry, t, hit: "wall", side: facingRight ? "near" : "far" };
        if (rx >= binRight && ry >= BIN_TOP) return { x: binRight, y: ry, t, hit: "wall", side: facingRight ? "far" : "near" };
        if (ry >= binBottom && rx >= BIN_LEFT && rx <= binRight) return { x: rx, y: binBottom, t, hit: "floor" };
        if (rx < BIN_LEFT || rx > binRight) continue;
        const relX = (rx - BIN_LEFT) / BIN_W, relY = (ry - BIN_TOP) / BIN_H;
        for (const obj of objects) {
            if (obj.type === "fill" || obj.type === "fill_tilted") {
                const s = getSurfRelY(obj, relX);
                if (s !== null && relY >= s) return { x: rx, y: ry, t, hit: "fill" };
            }
            if (obj.type === "vslab") {
                const ax = BIN_LEFT + obj.xRel * BIN_W;
                const at = BIN_TOP + obj.yTopRel * BIN_H, ab = BIN_TOP + obj.yBotRel * BIN_H;
                if (Math.abs(rx - ax) <= obj.halfW && ry >= at && ry <= ab)
                    return { x: rx, y: ry, t, hit: "object", id: obj.id };
            }
            if (obj.type === "vslab_leaning") {
                const ax = BIN_LEFT + obj.xRel * BIN_W;
                const at = BIN_TOP + obj.yTopRel * BIN_H, ab = BIN_TOP + obj.yBotRel * BIN_H;
                const lean = obj.lean ?? 0; // horizontal offset per unit vertical
                const midY = (at + ab) / 2;
                const offsetX = lean * (ry - midY);
                if (Math.abs(rx - ax - offsetX) <= obj.halfW && ry >= at && ry <= ab)
                    return { x: rx, y: ry, t, hit: "object", id: obj.id };
            }
            if (obj.type === "peak") {
                const px = BIN_LEFT + obj.xRel * BIN_W;
                const pt = BIN_TOP + obj.yTipRel * BIN_H, pb = BIN_TOP + obj.yBaseRel * BIN_H;
                const dist = Math.abs(rx - px);
                if (dist <= obj.halfW) {
                    const slope = (pb - pt) / obj.halfW;
                    const sy2 = pt + dist * slope;
                    if (ry >= sy2 && ry <= pb + 5) return { x: rx, y: ry, t, hit: "fill" };
                }
            }
        }
    }
    return null;
}

// ─── Calibrate ────────────────────────────────────────────────────────────────
function calibrateSensor(sx, sy, facingRight) {
    let maxY = sy;
    for (let a = -BEAM_HALF_DEG; a <= BEAM_HALF_DEG; a++) {
        const h = castRay(sx, sy, a, [], facingRight);
        if (h?.side === "near" && h.y > maxY) maxY = h.y;
    }
    return { blindZoneY: maxY + 14 };
}

// ─── Sensor reading ───────────────────────────────────────────────────────────
function computeSensor(sx, sy, facingRight, objects, blindZoneY) {
    const allRays = [];
    for (let a = -BEAM_HALF_DEG; a <= BEAM_HALF_DEG; a += 1.5) {
        const h = castRay(sx, sy, a, objects, facingRight);
        if (h) allRays.push({ angle: a, ...h });
    }
    const blindRays = allRays.filter(r => r.y < blindZoneY);
    const validRays = allRays.filter(r => r.y >= blindZoneY);
    const primary = [...validRays].sort((a, b) => a.t - b.t)[0] ?? null;
    let fillPct = 0, detectedY = BIN_TOP + BIN_H;
    if (primary) {
        detectedY = primary.y;
        const vh = (BIN_TOP + BIN_H) - blindZoneY;
        fillPct = Math.round(Math.max(0, Math.min(100, (1 - (primary.y - blindZoneY) / vh) * 100)));
    }
    return { fillPct, allRays, blindRays, validRays, primary, detectedY };
}

function fuse(rA, rB) {
    const diff = Math.abs(rA.fillPct - rB.fillPct);
    const anomaly = diff > DISAGREE_THRESH;
    const fused = Math.min(rA.fillPct, rB.fillPct);
    const fusedSensor = rA.fillPct <= rB.fillPct ? "A" : "B";
    return { fused, diff, anomaly, fusedSensor };
}

// ─── Canvas draw ──────────────────────────────────────────────────────────────
function draw(canvas, objects, rA, rB, fusion, calibA, calibB, hoveredId, dragId) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CW, CH);
    const binRight = BIN_LEFT + BIN_W, binBottom = BIN_TOP + BIN_H;

    ctx.fillStyle = "#07090f"; ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = "rgba(255,255,255,0.018)"; ctx.lineWidth = 1;
    for (let x = 0; x < CW; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,CH); ctx.stroke(); }
    for (let y = 0; y < CH; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(CW,y); ctx.stroke(); }

    // Walls
    ctx.fillStyle = "#111a28";
    ctx.fillRect(BIN_LEFT-WALL_T, BIN_TOP, WALL_T, BIN_H+WALL_T);
    ctx.fillRect(binRight, BIN_TOP, WALL_T, BIN_H+WALL_T);
    ctx.fillRect(BIN_LEFT-WALL_T, binBottom, BIN_W+WALL_T*2, WALL_T);
    ctx.strokeStyle = "#1e3a55"; ctx.lineWidth = 1;
    ctx.strokeRect(BIN_LEFT-WALL_T, BIN_TOP, WALL_T, BIN_H+WALL_T);
    ctx.strokeRect(binRight, BIN_TOP, WALL_T, BIN_H+WALL_T);
    ctx.strokeRect(BIN_LEFT-WALL_T, binBottom, BIN_W+WALL_T*2, WALL_T);
    ctx.fillStyle = "#04060c"; ctx.fillRect(BIN_LEFT, BIN_TOP, BIN_W, BIN_H);

    // Blind zones
    const bzA = calibA.blindZoneY, bzB = calibB.blindZoneY;
    ctx.fillStyle = "rgba(239,68,68,0.06)";
    ctx.fillRect(BIN_LEFT, BIN_TOP, BIN_W, Math.max(bzA, bzB) - BIN_TOP);
    ctx.beginPath(); ctx.moveTo(BIN_LEFT, bzA); ctx.lineTo(binRight, bzA);
    ctx.strokeStyle = "rgba(56,189,248,0.35)"; ctx.lineWidth = 1; ctx.setLineDash([4,3]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(BIN_LEFT, bzB); ctx.lineTo(binRight, bzB);
    ctx.strokeStyle = "rgba(168,85,247,0.35)"; ctx.stroke(); ctx.setLineDash([]);

    // Depth markers
    ctx.font = "9px monospace";
    for (let p = 0; p <= 100; p += 25) {
        const my = BIN_TOP + (p/100)*BIN_H;
        ctx.beginPath(); ctx.moveTo(binRight+WALL_T, my); ctx.lineTo(binRight+WALL_T+5, my);
        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillText(`${100-p}%`, binRight+WALL_T+8, my+3);
    }

    // ── Draw fill objects ─────────────────────────────────────────────────────
    for (const obj of objects) {
        if (obj.type !== "fill" && obj.type !== "fill_tilted") continue;
        ctx.beginPath();
        ctx.moveTo(BIN_LEFT, binBottom); ctx.lineTo(binRight, binBottom);
        for (let px = BIN_W; px >= 0; px--)
            ctx.lineTo(BIN_LEFT+px, BIN_TOP + getSurfRelY(obj, px/BIN_W)*BIN_H);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, BIN_TOP, 0, binBottom);
        g.addColorStop(0, "rgba(52,211,153,0.2)"); g.addColorStop(1, "rgba(52,211,153,0.05)");
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath();
        for (let px = 0; px <= BIN_W; px += 2) {
            const py = BIN_TOP + getSurfRelY(obj, px/BIN_W)*BIN_H;
            px===0 ? ctx.moveTo(BIN_LEFT+px,py) : ctx.lineTo(BIN_LEFT+px,py);
        }
        ctx.strokeStyle = "rgba(52,211,153,0.7)"; ctx.lineWidth=1.5; ctx.stroke();
    }

    // ── Draw foreign objects ──────────────────────────────────────────────────
    for (const obj of objects) {
        const isHov = obj.id === hoveredId;
        const isDrag = obj.id === dragId;
        const glow = isDrag ? 1.0 : isHov ? 0.7 : 0;

        if (obj.type === "vslab" || obj.type === "vslab_leaning") {
            const ax = BIN_LEFT + obj.xRel * BIN_W;
            const at = BIN_TOP + obj.yTopRel * BIN_H;
            const ah = (obj.yBotRel - obj.yTopRel) * BIN_H;
            const lean = obj.lean ?? 0;
            ctx.save();
            ctx.translate(ax, at + ah/2);
            if (lean) ctx.transform(1, 0, lean, 1, 0, 0);
            if (glow > 0) { ctx.shadowColor = obj.color; ctx.shadowBlur = 12 * glow; }
            ctx.fillStyle = obj.color + "55";
            ctx.strokeStyle = obj.color;
            ctx.lineWidth = isDrag ? 2.5 : isHov ? 2 : 1.5;
            ctx.fillRect(-obj.halfW, -ah/2, obj.halfW*2, ah);
            ctx.strokeRect(-obj.halfW, -ah/2, obj.halfW*2, ah);
            ctx.restore();
            // label
            ctx.fillStyle = obj.color; ctx.font = "9px monospace";
            ctx.fillText(obj.label, ax + obj.halfW + 5, at + 11);
        }

        if (obj.type === "peak") {
            const px = BIN_LEFT + obj.xRel * BIN_W;
            const pt = BIN_TOP + obj.yTipRel * BIN_H;
            const pb = BIN_TOP + obj.yBaseRel * BIN_H;
            ctx.save();
            if (glow > 0) { ctx.shadowColor = obj.color; ctx.shadowBlur = 12 * glow; }
            ctx.beginPath(); ctx.moveTo(px-obj.halfW, pb); ctx.lineTo(px, pt); ctx.lineTo(px+obj.halfW, pb); ctx.closePath();
            ctx.fillStyle = obj.color + "44"; ctx.strokeStyle = obj.color;
            ctx.lineWidth = isDrag ? 2.5 : isHov ? 2 : 1.5;
            ctx.fill(); ctx.stroke();
            ctx.restore();
            ctx.fillStyle = obj.color; ctx.font = "9px monospace";
            ctx.fillText(obj.label, px + obj.halfW + 5, pt);
        }
    }

    // ── Beam cones ────────────────────────────────────────────────────────────
    const sensors = [
        { sx: SA_X, sy: S_Y, fr: true,  col: "56,189,248",  blind: bzA, r: rA },
        { sx: SB_X, sy: S_Y, fr: false, col: "168,85,247",  blind: bzB, r: rB },
    ];

    for (const sen of sensors) {
        const lh = castRay(sen.sx, sen.sy, -BEAM_HALF_DEG, objects, sen.fr);
        const rh = castRay(sen.sx, sen.sy,  BEAM_HALF_DEG, objects, sen.fr);
        if (lh && rh) {
            ctx.beginPath(); ctx.moveTo(sen.sx,sen.sy); ctx.lineTo(lh.x,lh.y); ctx.lineTo(rh.x,rh.y); ctx.closePath();
            const cg = ctx.createRadialGradient(sen.sx,sen.sy,0,sen.sx,sen.sy,330);
            cg.addColorStop(0,`rgba(${sen.col},0.1)`); cg.addColorStop(1,`rgba(${sen.col},0.01)`);
            ctx.fillStyle=cg; ctx.fill();
        }

        for (const ray of sen.r.allRays) {
            const isBlind = ray.y < sen.blind;
            const isCenter = Math.abs(ray.angle) < 0.8;
            const col = isBlind ? "100,30,30"
                : ray.hit==="object" ? "239,68,68"
                    : ray.hit==="wall"   ? "249,115,22"
                        : sen.col;
            const op = isBlind ? (isCenter?0.28:0.07) : (isCenter?0.9:0.16);
            ctx.beginPath(); ctx.moveTo(sen.sx,sen.sy); ctx.lineTo(ray.x,ray.y);
            ctx.strokeStyle=`rgba(${col},${op})`; ctx.lineWidth=isCenter?2:0.7; ctx.stroke();
            ctx.beginPath(); ctx.arc(ray.x,ray.y,isCenter?4:1.5,0,Math.PI*2);
            ctx.fillStyle=`rgba(${col},${isBlind?0.18:(isCenter?1:0.45)})`; ctx.fill();
        }

        if (sen.r.primary) {
            const lc = sen.r.primary.hit==="object"?"#ef4444":sen.r.primary.hit==="wall"?"#f97316":`rgb(${sen.col})`;
            ctx.beginPath(); ctx.moveTo(BIN_LEFT,sen.r.detectedY); ctx.lineTo(binRight,sen.r.detectedY);
            ctx.strokeStyle=lc; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
        }

        // Sensor chip
        ctx.beginPath(); ctx.moveTo(sen.sx,sen.sy+8);
        if (sen.fr) { ctx.lineTo(BIN_LEFT-WALL_T-2,sen.sy+8); ctx.lineTo(BIN_LEFT-WALL_T-2,BIN_TOP+18); }
        else         { ctx.lineTo(binRight+WALL_T+2,sen.sy+8); ctx.lineTo(binRight+WALL_T+2,BIN_TOP+18); }
        ctx.strokeStyle=`rgba(${sen.col},0.28)`; ctx.lineWidth=2.5; ctx.lineJoin="round"; ctx.stroke();
        ctx.fillStyle="#152030"; ctx.strokeStyle=`rgb(${sen.col})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(sen.sx-14,sen.sy-14,28,14,3); ctx.fill(); ctx.stroke();
        ctx.fillStyle=`rgb(${sen.col})`; ctx.font="bold 9px monospace"; ctx.textAlign="center";
        ctx.fillText(`XM125-${sen.fr?"A":"B"}`,sen.sx,sen.sy-18); ctx.textAlign="left";
    }

    // Fused level
    if (rA.primary && rB.primary) {
        const fy = (rA.detectedY + rB.detectedY) / 2;
        ctx.beginPath(); ctx.moveTo(BIN_LEFT,fy); ctx.lineTo(binRight,fy);
        ctx.strokeStyle = fusion.anomaly?"rgba(239,68,68,0.8)":"rgba(255,255,255,0.55)";
        ctx.lineWidth=2; ctx.setLineDash([2,2]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = fusion.anomaly?"#ef4444":"#e2e8f0"; ctx.font="bold 9px monospace";
        ctx.fillText(fusion.anomaly?`⚠ ${fusion.diff}% gap`:`min(${fusion.fusedSensor})`, BIN_LEFT+4, fy-3);
    }

    ctx.fillStyle="rgba(255,255,255,0.1)"; ctx.font="9px monospace";
    ctx.fillText("RIM", BIN_LEFT+4, BIN_TOP-4);
}

// ─── Hit test for dragging ────────────────────────────────────────────────────
function hitTestObject(obj, cx, cy) {
    if (obj.type === "vslab" || obj.type === "vslab_leaning") {
        const ax = BIN_LEFT + obj.xRel * BIN_W;
        const at = BIN_TOP + obj.yTopRel * BIN_H;
        const ab = BIN_TOP + obj.yBotRel * BIN_H;
        return cx >= ax - obj.halfW - 8 && cx <= ax + obj.halfW + 8 && cy >= at && cy <= ab;
    }
    if (obj.type === "peak") {
        const px = BIN_LEFT + obj.xRel * BIN_W;
        const pt = BIN_TOP + obj.yTipRel * BIN_H;
        const pb = BIN_TOP + obj.yBaseRel * BIN_H;
        return Math.abs(cx - px) <= obj.halfW + 8 && cy >= pt - 8 && cy <= pb + 8;
    }
    return false;
}

// ─── Make a new foreign object at canvas position ─────────────────────────────
let objCounter = 0;
function makeObject(toolId, cx, cy, fillObj) {
    const id = ++objCounter;
    const relX = Math.max(0.05, Math.min(0.95, (cx - BIN_LEFT) / BIN_W));
    const relY = Math.max(0.02, Math.min(0.95, (cy - BIN_TOP) / BIN_H));

    // bottom of foreign object = fill surface or bin floor, whichever is higher
    const fillSurfRelY = fillObj ? getSurfRelY(fillObj, relX) : 1.0;
    const yBotRel = Math.min(fillSurfRelY, 0.98);
    const yTopRel = Math.max(0.02, relY);
    const safeTop = Math.min(yTopRel, yBotRel - 0.05);

    if (toolId === "vslab_wide")
        return { id, type:"vslab", xRel:relX, yTopRel:safeTop, yBotRel, halfW:5, label:"Cardboard", color:"#fbbf24" };
    if (toolId === "vslab_thin")
        return { id, type:"vslab", xRel:relX, yTopRel:safeTop, yBotRel, halfW:2, label:"Stick", color:"#fb923c" };
    if (toolId === "vslab_leaning")
        return { id, type:"vslab_leaning", xRel:relX, yTopRel:safeTop, yBotRel, halfW:4, lean:0.15, label:"Lean board", color:"#f472b6" };
    if (toolId === "peak")
        return { id, type:"peak", xRel:relX, yTipRel:Math.max(0.02, relY - 0.15), yBaseRel:Math.min(fillSurfRelY, yBotRel), halfW:40, label:"Bag peak", color:"#34d399" };
    return null;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export function RadarSimulatorPage() {
    const [fillPreset, setFillPreset] = useState("50");
    const [tool, setTool] = useState("vslab_wide");
    const [foreignObjs, setForeignObjs] = useState([]);
    const [rA, setRA] = useState(null);
    const [rB, setRB] = useState(null);
    const [fusion, setFusion] = useState(null);
    const [calib, setCalib] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [dragState, setDragState] = useState(null); // { id, startX, startY, origObj }
    const canvasRef = useRef(null);

    // Calibrate once
    useEffect(() => {
        setCalib({
            A: calibrateSensor(SA_X, S_Y, true),
            B: calibrateSensor(SB_X, S_Y, false),
        });
    }, []);

    // Build full object list: fill + foreign objects
    const fillObj = FILL_PRESETS.find(p => p.id === fillPreset)?.obj ?? null;
    const allObjects = [...(fillObj ? [fillObj] : []), ...foreignObjs];

    // Recompute readings whenever objects or calib change
    useEffect(() => {
        if (!calib) return;
        const readA = computeSensor(SA_X, S_Y, true,  allObjects, calib.A.blindZoneY);
        const readB = computeSensor(SB_X, S_Y, false, allObjects, calib.B.blindZoneY);
        const f = fuse(readA, readB);
        setRA(readA); setRB(readB); setFusion(f);
    }, [allObjects, calib]);

    // Redraw canvas
    useEffect(() => {
        if (!rA || !rB || !fusion || !calib || !canvasRef.current) return;
        draw(canvasRef.current, allObjects, rA, rB, fusion, calib.A, calib.B, hoveredId, dragState?.id);
    }, [rA, rB, fusion, calib, hoveredId, dragState, allObjects]);

    // Canvas coordinate helper
    const getCanvasXY = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = CW / rect.width, scaleY = CH / rect.height;
        return {
            cx: (e.clientX - rect.left) * scaleX,
            cy: (e.clientY - rect.top)  * scaleY,
        };
    }, []);

    const isInsideBin = (cx, cy) =>
        cx >= BIN_LEFT && cx <= BIN_LEFT + BIN_W && cy >= BIN_TOP && cy <= BIN_TOP + BIN_H;

    const handleMouseMove = useCallback((e) => {
        const { cx, cy } = getCanvasXY(e);

        if (dragState) {
            const dx = cx - dragState.startX;
            const dy = cy - dragState.startY;
            const orig = dragState.origObj;

            setForeignObjs(prev => prev.map(o => {
                if (o.id !== dragState.id) return o;
                const newXRel = Math.max(0.02, Math.min(0.98, orig.xRel + dx / BIN_W));
                const newYTopRel = Math.max(0.01, Math.min(0.9, orig.yTopRel + dy / BIN_H));
                const newYBotRel = Math.max(newYTopRel + 0.05, Math.min(0.99, orig.yBotRel + dy / BIN_H));
                if (o.type === "peak") {
                    return { ...o, xRel: newXRel, yTipRel: Math.max(0.01, orig.yTipRel + dy/BIN_H), yBaseRel: Math.max(0.1, Math.min(0.99, orig.yBaseRel + dy/BIN_H)) };
                }
                return { ...o, xRel: newXRel, yTopRel: newYTopRel, yBotRel: newYBotRel };
            }));
            return;
        }

        // Hover detection
        const hit = foreignObjs.find(o => hitTestObject(o, cx, cy));
        setHoveredId(hit?.id ?? null);
    }, [dragState, foreignObjs, getCanvasXY]);

    const handleMouseDown = useCallback((e) => {
        const { cx, cy } = getCanvasXY(e);
        if (!isInsideBin(cx, cy)) return;

        // Eraser
        if (tool === "eraser") {
            const hit = foreignObjs.find(o => hitTestObject(o, cx, cy));
            if (hit) setForeignObjs(prev => prev.filter(o => o.id !== hit.id));
            return;
        }

        // Try to drag existing object
        const hit = foreignObjs.find(o => hitTestObject(o, cx, cy));
        if (hit) {
            setDragState({ id: hit.id, startX: cx, startY: cy, origObj: { ...hit } });
            return;
        }

        // Place new object
        const newObj = makeObject(tool, cx, cy, fillObj);
        if (newObj) setForeignObjs(prev => [...prev, newObj]);
    }, [tool, foreignObjs, fillObj, getCanvasXY]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setDragState(null);
        setHoveredId(null);
    }, []);

    // Cursor style
    const getCursor = () => {
        if (tool === "eraser") return "crosshair";
        if (dragState) return "grabbing";
        if (hoveredId) return "grab";
        return "crosshair";
    };

    const blindPct = calib ? Math.round(((calib.A.blindZoneY - BIN_TOP) / BIN_H) * 100) : 0;

    return (
        <div style={{ minHeight:"100vh", background:"#07090f", color:"#e2e8f0", fontFamily:"'JetBrains Mono','Fira Code',monospace", padding:"16px", boxSizing:"border-box" }}>
            {/* Header */}
            <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:2 }}>
                    <span style={{ fontSize:9, color:"#38bdf8", letterSpacing:3, textTransform:"uppercase" }}>WasteIo</span>
                    <span style={{ fontSize:9, color:"#1a2a3a" }}>//</span>
                    <span style={{ fontSize:9, color:"#2d4050", letterSpacing:1 }}>Interactive · Dual Sensor · Drag to place objects</span>
                </div>
                <h1 style={{ margin:0, fontSize:17, fontWeight:700, color:"#f1f5f9", letterSpacing:-0.5 }}>XM125 Dual Sensor Simulator</h1>
                <p style={{ margin:"2px 0 0", fontSize:10, color:"#2d4050" }}>
                    Set fill level · pick a tool · click or drag objects into the bin · watch sensors react in real time
                </p>
            </div>

            <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>

                {/* ── Left controls ── */}
                <div style={{ width:180, flexShrink:0 }}>

                    {/* Fill level */}
                    <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:9, color:"#2d4050", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Fill Level</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {FILL_PRESETS.map(p => (
                                <button key={p.id} onClick={() => setFillPreset(p.id)} style={{
                                    background: fillPreset===p.id ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.03)",
                                    border:`1px solid ${fillPreset===p.id?"rgba(52,211,153,0.5)":"rgba(255,255,255,0.07)"}`,
                                    borderRadius:5, padding:"4px 8px", cursor:"pointer",
                                    color: fillPreset===p.id?"#34d399":"#3a5570", fontSize:10,
                                }}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tool selector */}
                    <div style={{ marginBottom:12 }}>
                        <div style={{ fontSize:9, color:"#2d4050", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Place Object</div>
                        {TOOLS.map(t => (
                            <button key={t.id} onClick={() => setTool(t.id)} style={{
                                display:"flex", alignItems:"center", gap:8, width:"100%", marginBottom:3,
                                background: tool===t.id ? `rgba(${t.id==="eraser"?"239,68,68":"251,191,36"},0.1)` : "rgba(255,255,255,0.02)",
                                border:`1px solid ${tool===t.id ? (t.id==="eraser"?"rgba(239,68,68,0.4)":"rgba(251,191,36,0.4)") : "rgba(255,255,255,0.05)"}`,
                                borderRadius:5, padding:"6px 10px", cursor:"pointer", textAlign:"left",
                            }}>
                                <span style={{ fontSize:14, color:t.color, width:16, textAlign:"center" }}>{t.icon}</span>
                                <div>
                                    <div style={{ fontSize:10, color:tool===t.id?t.color:"#3a5570" }}>{t.label}</div>
                                    <div style={{ fontSize:8, color:"#2d4050" }}>{t.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Clear objects */}
                    <button onClick={() => setForeignObjs([])} style={{
                        display:"block", width:"100%", padding:"6px 0", marginBottom:12,
                        background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)",
                        borderRadius:5, cursor:"pointer", color:"rgba(239,68,68,0.7)", fontSize:10,
                    }}>
                        Clear all objects
                    </button>

                    {/* Calibration info */}
                    <div style={{ padding:"9px 11px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:7, marginBottom:12 }}>
                        <div style={{ fontSize:9, color:"rgba(239,68,68,0.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Calibration</div>
                        <div style={{ fontSize:10, color:"#334155", lineHeight:1.8 }}>
                            <div>Blind zone: <span style={{ color:"#ef4444" }}>{blindPct}%</span></div>
                            <div>Disagree &gt;{DISAGREE_THRESH}%: <span style={{ color:"#f97316" }}>anomaly</span></div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ padding:"9px 11px", background:"rgba(255,255,255,0.02)", borderRadius:7, border:"1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ fontSize:9, color:"#2d4050", letterSpacing:2, textTransform:"uppercase", marginBottom:5 }}>Legend</div>
                        {[
                            { c:"#38bdf8",  l:"Sensor A (cyan)" },
                            { c:"#a855f7",  l:"Sensor B (purple)" },
                            { c:"#f1f5f9",  l:"Fused level" },
                            { c:"#ef4444",  l:"Object hit / anomaly" },
                            { c:"#f97316",  l:"Wall hit" },
                            { c:"#34d399",  l:"Fill surface" },
                            { c:"rgba(239,68,68,0.3)", l:"Blind zone" },
                        ].map(x => (
                            <div key={x.l} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                                <div style={{ width:8,height:8,borderRadius:2,background:x.c,border:"1px solid rgba(255,255,255,0.08)",flexShrink:0 }}/>
                                <span style={{ fontSize:9, color:"#3a5570" }}>{x.l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Canvas ── */}
                <div style={{ flex:"1 1 300px" }}>
                    <canvas
                        ref={canvasRef}
                        width={CW} height={CH}
                        style={{ borderRadius:9, border:"1px solid rgba(56,189,248,0.1)", display:"block", background:"#07090f", width:"100%", maxWidth:CW, cursor:getCursor() }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    />
                    <div style={{ marginTop:7, padding:"6px 11px", background:"rgba(56,189,248,0.03)", border:"1px solid rgba(56,189,248,0.07)", borderRadius:6, fontSize:10, color:"#2d4050" }}>
                        {tool === "eraser"
                            ? "Click on any object to remove it"
                            : `Selected: ${TOOLS.find(t=>t.id===tool)?.label} — click inside bin to place · drag existing objects to reposition`}
                    </div>
                </div>

                {/* ── Readings ── */}
                {rA && rB && fusion && (
                    <div style={{ width:155, flexShrink:0 }}>
                        <div style={{ fontSize:9, color:"#2d4050", letterSpacing:2, textTransform:"uppercase", marginBottom:7 }}>Output</div>

                        {[
                            { label:"Sensor A", value:rA.fillPct, color:rA.primary?.hit==="object"?"#ef4444":"#38bdf8", hit:rA.primary?.hit },
                            { label:"Sensor B", value:rB.fillPct, color:rB.primary?.hit==="object"?"#ef4444":"#a855f7", hit:rB.primary?.hit },
                        ].map(item => (
                            <div key={item.label} style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${item.color}33`, borderRadius:8, padding:11, marginBottom:7 }}>
                                <div style={{ fontSize:9, color:item.color+"88", marginBottom:4 }}>{item.label}</div>
                                <div style={{ fontSize:32, fontWeight:700, lineHeight:1, color:item.color }}>
                                    {item.value}<span style={{ fontSize:13, fontWeight:400 }}>%</span>
                                </div>
                                <div style={{ marginTop:5, height:3, background:"#0d1117", borderRadius:2, overflow:"hidden" }}>
                                    <div style={{ height:"100%", width:`${item.value}%`, background:item.color, borderRadius:2, transition:"width 0.2s" }}/>
                                </div>
                                <div style={{ fontSize:9, color:"#2d4050", marginTop:3 }}>
                                    hit: <span style={{ color: item.hit==="object"?"#ef4444":item.hit==="wall"?"#f97316":item.color }}>{item.hit??"—"}</span>
                                </div>
                            </div>
                        ))}

                        {/* Fused */}
                        <div style={{
                            background: fusion.anomaly?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.025)",
                            border:`1px solid ${fusion.anomaly?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.08)"}`,
                            borderRadius:8, padding:11, marginBottom:7,
                        }}>
                            <div style={{ fontSize:9, color:fusion.anomaly?"rgba(239,68,68,0.7)":"rgba(255,255,255,0.25)", marginBottom:4 }}>
                                {fusion.anomaly ? `⚠ min(${fusion.fusedSensor})` : `min(${fusion.fusedSensor})`}
                            </div>
                            <div style={{ fontSize:32, fontWeight:700, lineHeight:1, color:fusion.anomaly?"#ef4444":"#f1f5f9" }}>
                                {fusion.fused}<span style={{ fontSize:13, fontWeight:400 }}>%</span>
                            </div>
                            <div style={{ marginTop:5, height:3, background:"#0d1117", borderRadius:2, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${fusion.fused}%`, background:fusion.anomaly?"#ef4444":"#e2e8f0", borderRadius:2, transition:"width 0.2s" }}/>
                            </div>
                            <div style={{ fontSize:9, color:fusion.anomaly?"#ef4444":"#2d4050", marginTop:3 }}>
                                gap: {fusion.diff}% {fusion.anomaly?"⚠":"✓"}
                            </div>
                        </div>

                        {/* Object count */}
                        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:8, padding:11 }}>
                            <div style={{ fontSize:9, color:"#2d4050", marginBottom:4 }}>Scene</div>
                            <div style={{ fontSize:10, color:"#334155", lineHeight:1.9 }}>
                                <div>Fill: <span style={{ color:"#34d399" }}>{fillPreset}</span></div>
                                <div>Objects: <span style={{ color:"#fbbf24" }}>{foreignObjs.length}</span></div>
                                <div>Mode: <span style={{ color:"#94a3b8" }}>{TOOLS.find(t=>t.id===tool)?.label}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}