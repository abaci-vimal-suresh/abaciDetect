import { useState, useCallback, useRef, useEffect } from 'react';
import { AreaWall, WallDrawSettings, Point2D, WallType } from '../Types/types';


const DEFAULT_SETTINGS: WallDrawSettings = {
    wall_type: 'outer',
    height: 3.0,
    thickness: 0.18,
    color: '#4a90d9',
    opacity: 0.85,
};

// ── Arc Math ──────────────────────────────────────────────────────────────────

function circumcenter(
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
): { x: number; y: number } | null {
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(D) < 1e-10) return null;
    const ux =
        ((ax * ax + ay * ay) * (by - cy) +
            (bx * bx + by * by) * (cy - ay) +
            (cx * cx + cy * cy) * (ay - by)) / D;
    const uy =
        ((ax * ax + ay * ay) * (cx - bx) +
            (bx * bx + by * by) * (ax - cx) +
            (cx * cx + cy * cy) * (bx - ax)) / D;
    return { x: ux, y: uy };
}

function buildArcWall(
    p1: Point2D,
    p2: Point2D,
    p3: Point2D,
    floorId: number,
    settings: WallDrawSettings,
    floorWidth: number,
    floorDepth: number,
    targetAreaId: number | null,
): AreaWall | null {
    // Convert normalized → real metres for circumcenter math
    const m1 = { x: p1.nx * floorWidth, y: p1.ny * floorDepth };
    const m2 = { x: p2.nx * floorWidth, y: p2.ny * floorDepth };
    const m3 = { x: p3.nx * floorWidth, y: p3.ny * floorDepth };

    const center = circumcenter(m1.x, m1.y, m2.x, m2.y, m3.x, m3.y);
    if (!center) return null;

    const radius = Math.sqrt(
        (m1.x - center.x) ** 2 + (m1.y - center.y) ** 2
    );

    let startAngle = Math.atan2(m1.y - center.y, m1.x - center.x);
    let endAngle = Math.atan2(m2.y - center.y, m2.x - center.x);
    const p3Angle = Math.atan2(m3.y - center.y, m3.x - center.x);

    // Normalise so arc sweeps through p3
    const norm = (a: number, base: number) => {
        while (a < base) a += Math.PI * 2;
        while (a >= base + Math.PI * 2) a -= Math.PI * 2;
        return a;
    };

    const endCCW = norm(endAngle, startAngle);
    const p3CCW = norm(p3Angle, startAngle);

    if (!(p3CCW >= 0 && p3CCW <= endCCW)) {
        [startAngle, endAngle] = [endAngle, startAngle];
    }

    return {
        id: -(Date.now() + Math.floor(Math.random() * 9999)),
        area_id: floorId,
        sub_area_id: targetAreaId ?? undefined,
        r_x1: p1.nx, r_y1: p1.ny,
        r_x2: p2.nx, r_y2: p2.ny,
        r_height: settings.height,
        r_z_offset: 0,
        thickness: settings.thickness,
        wall_type: settings.wall_type,
        color: settings.color,
        opacity: settings.opacity,
        wall_shape: 'arc',
        arc_center_x: center.x / floorWidth,
        arc_center_z: center.y / floorDepth,
        arc_radius: radius / floorWidth,
        arc_start_angle: startAngle,
        arc_end_angle: endAngle,
        arc_segments: 48,
    };
}

// ── Return Type ───────────────────────────────────────────────────────────────

export interface UseWallDrawingReturn {
    // State
    isDrawing: boolean;
    isShapeClosed: boolean;
    drawingMode: 'straight' | 'arc';
    anchorPoints: Point2D[];
    points: Point2D[];
    previewPoint: Point2D | null;
    arcPreviewWall: AreaWall | null;
    drawnWalls: AreaWall[];
    settings: WallDrawSettings;
    targetAreaId: number | null;

    // Actions
    startDrawing: () => void;
    cancelDrawing: () => void;
    finishDrawing: () => void;
    addPoint: (nx: number, ny: number) => void;
    updatePreview: (nx: number, ny: number) => void;
    removeLastWall: () => void;
    clearAll: () => void;
    updateSettings: (patch: Partial<WallDrawSettings>) => void;
    setDrawingMode: (mode: 'straight' | 'arc') => void;
    setTargetAreaId: (id: number | null) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWallDrawing(
    floorId: number | null,
    floorWidth: number = 20,
    floorDepth: number = 15,
    floorHeight: number = 3.0,
): UseWallDrawingReturn {

    // ── React state (drives re-renders) ──────────────────────────────────────
    const [isDrawing, setIsDrawing] = useState(false);
    const [isShapeClosed, setIsShapeClosed] = useState(false);
    const [drawingMode, setDrawingModeState] = useState<'straight' | 'arc'>('straight');
    const [anchorPoints, setAnchorPoints] = useState<Point2D[]>([]);
    const [points, setPoints] = useState<Point2D[]>([]);
    const [previewPoint, setPreviewPoint] = useState<Point2D | null>(null);
    const [arcPreviewWall, setArcPreviewWall] = useState<AreaWall | null>(null);
    const [drawnWalls, setDrawnWalls] = useState<AreaWall[]>([]);
    const [settings, setSettings] = useState<WallDrawSettings>({
        ...DEFAULT_SETTINGS,
        height: floorHeight,
    });
    const [targetAreaId, setTargetAreaIdState] = useState<number | null>(null);

    // ── Refs — always fresh, safe inside Three.js callbacks ──────────────────
    const isDrawingRef = useRef(false);
    const isShapeClosedRef = useRef(false);
    const drawingModeRef = useRef<'straight' | 'arc'>('straight');
    const anchorPointsRef = useRef<Point2D[]>([]);
    const pointsRef = useRef<Point2D[]>([]);
    const settingsRef = useRef<WallDrawSettings>({ ...DEFAULT_SETTINGS, height: floorHeight });
    const floorIdRef = useRef(floorId);
    const floorWidthRef = useRef(floorWidth);
    const floorDepthRef = useRef(floorDepth);
    const targetAreaIdRef = useRef<number | null>(null);

    // Keep refs in sync with props
    useEffect(() => { floorIdRef.current = floorId; }, [floorId]);
    useEffect(() => { floorWidthRef.current = floorWidth; }, [floorWidth]);
    useEffect(() => { floorDepthRef.current = floorDepth; }, [floorDepth]);

    // Sync height into settings when floor changes
    useEffect(() => {
        setSettings(s => {
            const next = { ...s, height: floorHeight };
            settingsRef.current = next;
            return next;
        });
    }, [floorHeight]);

    // ── Sync helpers (state + ref together) ──────────────────────────────────

    const syncIsDrawing = (val: boolean) => {
        isDrawingRef.current = val;
        setIsDrawing(val);
    };

    const syncIsShapeClosed = (val: boolean) => {
        isShapeClosedRef.current = val;
        setIsShapeClosed(val);
    };

    const syncPoints = (updater: (prev: Point2D[]) => Point2D[]) => {
        setPoints(prev => {
            const next = updater(prev);
            pointsRef.current = next;
            return next;
        });
    };

    const syncAnchorPoints = (updater: ((prev: Point2D[]) => Point2D[]) | Point2D[]) => {
        setAnchorPoints(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            anchorPointsRef.current = next;
            return next;
        });
    };

    // ── Full reset ────────────────────────────────────────────────────────────

    const resetAll = useCallback(() => {
        syncIsDrawing(false);
        syncIsShapeClosed(false);
        syncPoints(() => []);
        syncAnchorPoints([]);
        setDrawnWalls([]);
        setPreviewPoint(null);
        setArcPreviewWall(null);
    }, []);

    // ── ESC key to cancel ─────────────────────────────────────────────────────

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDrawingRef.current) resetAll();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [resetAll]);

    // ── Public actions ────────────────────────────────────────────────────────

    const startDrawing = useCallback(() => {
        syncIsDrawing(true);
        syncIsShapeClosed(false);
        syncPoints(() => []);
        syncAnchorPoints([]);
        setPreviewPoint(null);
        setArcPreviewWall(null);
        setDrawnWalls([]);
    }, []);

    const cancelDrawing = useCallback(() => {
        resetAll();
    }, [resetAll]);

    // Close the polygon — add closing wall from last anchor → first anchor
    const finishDrawing = useCallback(() => {
        const anchors = anchorPointsRef.current;
        const fid = floorIdRef.current;

        if (anchors.length >= 3 && fid != null) {
            const first = anchors[0];
            const last = anchors[anchors.length - 1];
            const dist = Math.sqrt(
                (first.nx - last.nx) ** 2 + (first.ny - last.ny) ** 2
            );
            if (dist > 0.005) {
                const s = settingsRef.current;
                const closingWall: AreaWall = {
                    id: -(Date.now() + Math.floor(Math.random() * 9999)),
                    area_id: fid,
                    sub_area_id: targetAreaIdRef.current ?? undefined,
                    r_x1: last.nx, r_y1: last.ny,
                    r_x2: first.nx, r_y2: first.ny,
                    r_height: s.height,
                    r_z_offset: 0,
                    thickness: s.thickness,
                    wall_type: s.wall_type,
                    color: s.color,
                    opacity: s.opacity,
                    wall_shape: 'straight',
                };
                setDrawnWalls(w => [...w, closingWall]);
            }
        }

        syncPoints(() => []);
        setPreviewPoint(null);
        setArcPreviewWall(null);
        syncIsShapeClosed(true);
    }, []);

    // ── addPoint ──────────────────────────────────────────────────────────────

    const addPoint = useCallback((nx: number, ny: number) => {
        if (!isDrawingRef.current) return;
        if (isShapeClosedRef.current) return;
        const fid = floorIdRef.current;
        if (fid == null) return;

        if (drawingModeRef.current === 'straight') {
            const anchors = anchorPointsRef.current;

            if (anchors.length === 0) {
                // First click — seed anchor chain, no wall yet
                syncAnchorPoints(prev => [...prev, { nx, ny }]);
            } else {
                // Draw wall from last anchor → this point
                const from = anchors[anchors.length - 1];
                const s = settingsRef.current;
                const wall: AreaWall = {
                    id: -(Date.now() + Math.floor(Math.random() * 9999)),
                    area_id: fid,
                    sub_area_id: targetAreaIdRef.current ?? undefined,
                    r_x1: from.nx, r_y1: from.ny,
                    r_x2: nx, r_y2: ny,
                    r_height: s.height,
                    r_z_offset: 0,
                    thickness: s.thickness,
                    wall_type: s.wall_type,
                    color: s.color,
                    opacity: s.opacity,
                    wall_shape: 'straight',
                };
                setDrawnWalls(w => [...w, wall]);
                syncAnchorPoints(prev => [...prev, { nx, ny }]);
            }
            syncPoints(() => []);

        } else {
            // Arc mode — collect 3 clicks then emit arc wall
            syncPoints(prev => {
                const next = [...prev, { nx, ny }];

                if (next.length === 3) {
                    const [p1, p2, p3] = next;
                    const s = settingsRef.current;
                    const w = floorWidthRef.current;
                    const d = floorDepthRef.current;
                    const arc = buildArcWall(
                        p1, p2, p3, fid, s, w, d, targetAreaIdRef.current
                    );
                    if (arc) setDrawnWalls(walls => [...walls, arc]);

                    // p2 becomes the next anchor endpoint
                    syncAnchorPoints(prev => [...prev, p2]);
                    setArcPreviewWall(null);
                    setPreviewPoint(null);
                    return [];
                }

                return next;
            });
        }
    }, []);

    // ── updatePreview ─────────────────────────────────────────────────────────

    const updatePreview = useCallback((nx: number, ny: number) => {
        if (!isDrawingRef.current || isShapeClosedRef.current) {
            setPreviewPoint(null);
            setArcPreviewWall(null);
            return;
        }

        const anchors = anchorPointsRef.current;
        const pts = pointsRef.current;

        if (drawingModeRef.current === 'straight') {
            // Show a dashed line from last anchor → cursor
            setPreviewPoint(anchors.length > 0 ? { nx, ny } : null);
            setArcPreviewWall(null);

        } else {
            // Arc mode
            if (pts.length === 0) {
                setPreviewPoint(anchors.length > 0 ? { nx, ny } : null);
                setArcPreviewWall(null);
            } else if (pts.length === 1) {
                setPreviewPoint({ nx, ny });
                setArcPreviewWall(null);
            } else if (pts.length === 2) {
                // Full live arc preview
                setPreviewPoint(null);
                const fid = floorIdRef.current ?? -1;
                const s = settingsRef.current;
                const w = floorWidthRef.current;
                const d = floorDepthRef.current;
                const arc = buildArcWall(
                    pts[0], pts[1], { nx, ny }, fid, s, w, d, targetAreaIdRef.current
                );
                setArcPreviewWall(arc ? { ...arc, opacity: 0.45 } : null);
            }
        }
    }, []);

    // ── Minor actions ─────────────────────────────────────────────────────────

    const removeLastWall = useCallback(() => {
        setDrawnWalls(prev => {
            if (prev.length === 0) return prev;
            const next = prev.slice(0, -1);
            // Also pop last anchor so chain stays consistent
            syncAnchorPoints(a => a.slice(0, -1));
            return next;
        });
    }, []);

    const clearAll = useCallback(() => {
        resetAll();
    }, [resetAll]);

    const updateSettings = useCallback((patch: Partial<WallDrawSettings>) => {
        setSettings(s => {
            const next = { ...s, ...patch };
            settingsRef.current = next;
            return next;
        });
    }, []);

    const setDrawingMode = useCallback((mode: 'straight' | 'arc') => {
        drawingModeRef.current = mode;
        setDrawingModeState(mode);
        // Carry last anchor as seed if switching to arc
        const lastAnchor = anchorPointsRef.current.slice(-1)[0] ?? null;
        syncPoints(() => (lastAnchor && mode === 'arc') ? [lastAnchor] : []);
        setPreviewPoint(null);
        setArcPreviewWall(null);
    }, []);

    const setTargetAreaId = useCallback((id: number | null) => {
        targetAreaIdRef.current = id;
        setTargetAreaIdState(id);
        // Retroactively tag already drawn walls
        setDrawnWalls(prev =>
            prev.map(w => ({ ...w, sub_area_id: id ?? undefined }))
        );
    }, []);

    // ── Return ────────────────────────────────────────────────────────────────

    return {
        isDrawing,
        isShapeClosed,
        drawingMode,
        anchorPoints,
        points,
        previewPoint,
        arcPreviewWall,
        drawnWalls,
        settings,
        targetAreaId,
        startDrawing,
        cancelDrawing,
        finishDrawing,
        addPoint,
        updatePreview,
        removeLastWall,
        clearAll,
        updateSettings,
        setDrawingMode,
        setTargetAreaId,
    };
}