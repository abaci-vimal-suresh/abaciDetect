// src/pages/halo/HaloPage.tsx

import React, {
	useState, useCallback, useRef, useMemo, useEffect, Suspense
} from 'react';
import { Canvas } from '@react-three/fiber';
import {
	CameraControls, PerspectiveCamera,
	GizmoHelper, GizmoViewcube, Environment
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { AreaNode, AreaWall, SensorHalo, SensorNode } from '../Types/types';
import {
	HALO_DUMMY_TREE, DUMMY_WALLS, DUMMY_SENSORS,
	findNodeById, getSensorsForFloor
} from '../Dummy/dummyData';
import { useWallDrawing } from '../Hooks/useWallDrawing';
import { useRef as useThreeRef } from 'react';
import MockAlertPanel, { HaloAlertPayload } from '../Components/MockAlertPanel';
import { SensorAlertEmit } from '../ThreeD/components/scene/emits/SensorAlertEmit';
import HaloSidebar from '../Components/HaloSidebar';
import HaloRightPanel, { RightPanelMode } from '../Components/HaloRightPanel';
import HaloFloorScene from '../Components/HaloFloorScene';
import { useSensorPlacement } from '../Hooks/useSensorPlacement';
import SensorDetailPanel from '../Components/SensorDetailPanel';
import SensorPlacementPanel from '../Components/SensorPlacementPanel';
import styles from './HaloPage.module.scss';

// ── Scene level type ──────────────────────────────────────────────────────────
export type SceneLevel = 'site' | 'building' | 'floor' | 'area';

// ── ZoomOnlyWhenLocked ────────────────────────────────────────────────────────
const ZoomOnlyWhenLocked: React.FC<{ locked: boolean }> = ({ locked }) => {
	const { camera, gl } = useThree();
	useEffect(() => {
		if (!locked) return;
		const canvas = gl.domElement;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const factor = e.deltaY > 0 ? 1.12 : 0.89;
			const newY = Math.max(5, Math.min(200, camera.position.y * factor));
			camera.position.setY(newY);
		};
		canvas.addEventListener('wheel', onWheel, { passive: false });
		return () => canvas.removeEventListener('wheel', onWheel);
	}, [locked, camera, gl]);
	return null;
};

// ── Page ──────────────────────────────────────────────────────────────────────
const HaloPage: React.FC = () => {

	// ── Selection state ───────────────────────────────────────────────────────
	const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
	const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);
	const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
	const [sceneLevel, setSceneLevel] = useState<SceneLevel>('site');

	// ── Panel state ───────────────────────────────────────────────────────────
	const [showSidebar, setShowSidebar] = useState(true);
	const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>(null);
	const [blinkingWallIds, setBlinkingWallIds] = useState<(number | string)[]>([]);

	const sensorPlacement = useSensorPlacement();
	const [selectedSensorId, setSelectedSensorId] = useState<number | null>(null);
	const [pendingUnplacedId, setPendingUnplacedId] = useState<number | null>(null);

	// ── Local data state ──────────────────────────────────────────────────────
	const [wallsByFloor, setWallsByFloor] = useState<Record<number, AreaWall[]>>(DUMMY_WALLS);
	const [sensors, setSensors] = useState<SensorNode[]>(DUMMY_SENSORS);
	const [areaTree, setAreaTree] = useState<AreaNode>(HALO_DUMMY_TREE);

	const [showMockPanel, setShowMockPanel] = useState(false);
	const [focusedSensorId, setFocusedSensorId] = useState<number | null>(null);
	const [activeEmits, setActiveEmits] = useState<{
		id: number;
		position: [number, number, number];
		eventSource: string;
		intensity: number;
	}[]>([]);

	// ── Camera ref ────────────────────────────────────────────────────────────
	const cameraControlsRef = useRef<any>(null);

	// ── Derived nodes ─────────────────────────────────────────────────────────
	const selectedBuilding = useMemo(() =>
		selectedBuildingId ? findNodeById(areaTree, selectedBuildingId) : null,
		[selectedBuildingId, areaTree]
	);

	const selectedFloor = useMemo(() =>
		selectedFloorId ? findNodeById(areaTree, selectedFloorId) : null,
		[selectedFloorId, areaTree]
	);

	const selectedArea = useMemo(() =>
		selectedAreaId ? findNodeById(areaTree, selectedAreaId) : null,
		[selectedAreaId, areaTree]
	);

	const selectedSensor = useMemo(() =>
		sensors.find(s => s.id === selectedSensorId) ?? null,
		[sensors, selectedSensorId]
	);

	const placedSensors = useMemo(() =>
		sensors.filter(s =>
			s.floor_id !== null &&
			s.floor_id === selectedFloorId
		),
		[sensors, selectedFloorId]
	);

	const unplacedSensors = useMemo(() =>
		sensors.filter(s => s.floor_id === null),
		[sensors]
	);

	// ── Wall drawing hook ─────────────────────────────────────────────────────
	const wallDrawing = useWallDrawing(
		selectedFloorId,
		selectedFloor?.floor_width ?? 20,
		selectedFloor?.floor_depth ?? 15,
		selectedFloor?.floor_height ?? 3.0,
	);

	// ── Camera control per scene level ────────────────────────────────────────
	useEffect(() => {
		const cc = cameraControlsRef.current;
		if (!cc) return;

		if (wallDrawing.isDrawing) {
			const fw = selectedFloor?.floor_width ?? 20;
			const fd = selectedFloor?.floor_depth ?? 15;
			const maxDim = Math.max(fw, fd);
			cc.rotatePolarTo(0.01, true);
			cc.rotateAzimuthTo(0, true);
			cc.setPosition(0, maxDim * 1.4, 0.001, true);
			cc.setTarget(0, 0, 0, true);
			cc.minPolarAngle = 0;
			cc.maxPolarAngle = 0.01;
			cc.minAzimuthAngle = -0.01;
			cc.maxAzimuthAngle = 0.01;
			cc.mouseButtons.left = 0;
			cc.mouseButtons.right = 0;
			cc.enabled = true;
			return;
		}

		// Unlock for all other levels
		cc.enabled = true;
		cc.minPolarAngle = 0.05;
		cc.maxPolarAngle = Math.PI / 2.1;
		cc.minAzimuthAngle = -Infinity;
		cc.maxAzimuthAngle = Infinity;
		cc.mouseButtons.left = 1;
		cc.mouseButtons.right = 2;

		// Animate camera to level
		switch (sceneLevel) {
			case 'site':
				cc.setPosition(0, 80, 80, true);
				cc.setTarget(0, 0, 0, true);
				break;
			case 'building': {
				const floors = selectedBuilding?.children?.filter(
					c => c.area_type === 'Floor'
				) ?? [];
				const totalH = floors.reduce(
					(h, f) => h + (f.floor_height ?? 3), 0
				);
				cc.setPosition(0, totalH * 2 + 20, totalH * 2 + 25, true);
				cc.setTarget(0, totalH / 2, 0, true);
				break;
			}
			case 'floor':
			case 'area':
				cc.setPosition(0, 28, 0.001, true);
				cc.setTarget(0, 0, 0, true);
				break;
		}
	}, [sceneLevel, wallDrawing.isDrawing, selectedFloor, selectedBuilding]);

	// ── Sidebar handlers ──────────────────────────────────────────────────────

	const handleSelectSite = useCallback(() => {
		setSelectedBuildingId(null);
		setSelectedFloorId(null);
		setSelectedAreaId(null);
		setSceneLevel('site');
		setRightPanelMode(null);
		wallDrawing.cancelDrawing();
	}, [wallDrawing]);

	const handleSelectBuilding = useCallback((id: number) => {
		setSelectedBuildingId(id);
		setSelectedFloorId(null);
		setSelectedAreaId(null);
		setSceneLevel('building');
		setRightPanelMode(null);
		wallDrawing.cancelDrawing();
	}, [wallDrawing]);

	const handleSelectFloor = useCallback((id: number) => {
		setSelectedFloorId(prev => {
			if (prev === id) return prev;
			return id;
		});
		setSelectedAreaId(null);
		setSceneLevel('floor');
		setRightPanelMode(null);
		wallDrawing.cancelDrawing();
		sensorPlacement.cancelPlacing();
		setSelectedSensorId(null);
	}, [wallDrawing, sensorPlacement]);

	const handleSelectArea = useCallback((id: number) => {
		setSelectedAreaId(prev => prev === id ? null : id);
		setSceneLevel('area');
		setRightPanelMode(null);
		wallDrawing.cancelDrawing();
	}, [wallDrawing]);

	// ── Image handlers ────────────────────────────────────────────────────────

	const handleImageUpload = useCallback((floorId: number, objectUrl: string) => {
		setAreaTree(prev => {
			const patch = (node: AreaNode): AreaNode => ({
				...node,
				area_plan: node.id === floorId ? objectUrl : node.area_plan,
				children: node.children?.map(patch),
			});
			return patch(prev);
		});
	}, []);

	const handleImageRemove = useCallback((floorId: number) => {
		setAreaTree(prev => {
			const patch = (node: AreaNode): AreaNode => ({
				...node,
				area_plan: node.id === floorId ? null : node.area_plan,
				children: node.children?.map(patch),
			});
			return patch(prev);
		});
	}, []);

	// ── Wall save ─────────────────────────────────────────────────────────────

	const handleSaveWalls = useCallback(() => {
		if (!selectedFloorId) return;
		if (wallDrawing.drawnWalls.length === 0) return;
		setWallsByFloor(prev => ({
			...prev,
			[selectedFloorId]: [
				...(prev[selectedFloorId] ?? []),
				...wallDrawing.drawnWalls,
			],
		}));
		wallDrawing.cancelDrawing();
	}, [selectedFloorId, wallDrawing]);

	// ── Sensor handlers ────────────────────────────────────────────────────────

	const handleAddSensor = useCallback((s: SensorNode) => {
		setSensors(prev => [...prev, s]);
	}, []);

	const handleRemoveSensor = useCallback((id: number) => {
		setSensors(prev => prev.filter(s => s.id !== id));
		if (selectedSensorId === id) setSelectedSensorId(null);
	}, [selectedSensorId]);

	// Sensor click handler — passed down to HaloFloorScene
	const handleSensorClick = useCallback((sensor: SensorNode) => {
		setSelectedSensorId(sensor.id);
		setRightPanelMode('sensor_detail');
		setFocusedSensorId(sensor.id);

		// Sync with area and walls
		if (sensor.area_id) {
			setSelectedAreaId(sensor.area_id);
		}
		if (sensor.wall_ids) {
			setBlinkingWallIds(sensor.wall_ids);
		} else {
			setBlinkingWallIds([]);
		}
	}, []);

	// Sensor placement tool toggle
	const handleSensorPlaceToggle = useCallback(() => {
		if (!selectedFloorId) return;
		sensorPlacement.cancelPlacing();
		setRightPanelMode(prev =>
			prev === 'sensor_place' ? null : 'sensor_place'
		);
		wallDrawing.cancelDrawing();
	}, [selectedFloorId, sensorPlacement, wallDrawing]);

	// handler — called when user clicks an unplaced sensor card
	const handleStartPlacingFromPanel = useCallback(() => {
		setPendingUnplacedId(null);
		sensorPlacement.startPlacing();
		// Keep panel open — user needs to see the ghost instruction
	}, [sensorPlacement]);

	const handleStartPlacingSpecific = useCallback((sensorId: number) => {
		setPendingUnplacedId(sensorId);
		sensorPlacement.startPlacing();
	}, [sensorPlacement]);

	// Floor click during placement — called from HaloFloorScene
	const handleSensorPlaced = useCallback((nx: number, ny: number) => {
		if (!selectedFloorId) return;

		if (pendingUnplacedId !== null) {
			// Placing an existing unplaced sensor
			setSensors(prev => prev.map(s =>
				s.id === pendingUnplacedId
					? {
						...s,
						floor_id: selectedFloorId,
						x_val: nx,
						y_val: ny,
						z_val: 0.85,
						online_status: true,
						sensor_status: 'online' as const,
						halo_color: '#06d6a0',
						halo_intensity: 0.35,
					}
					: s
			));
			setPendingUnplacedId(null);
			sensorPlacement.cancelPlacing();
			setRightPanelMode('sensor_place');
			return;
		}

		// New sensor placement
		const count = sensors.filter(s => s.floor_id === selectedFloorId).length;
		sensorPlacement.placeSensor(nx, ny, selectedFloorId, count);
		setRightPanelMode('sensor_placement');
	}, [selectedFloorId, sensors, sensorPlacement, pendingUnplacedId]);

	// Confirm placement
	const handleConfirmPlacement = useCallback((
		name: string, mac: string, events: string[]
	) => {
		if (!sensorPlacement.pendingSensor) return;
		const newSensor = sensorPlacement.confirmPlacement(
			sensorPlacement.pendingSensor, name, mac, events
		);
		setSensors(prev => [...prev, newSensor]);
		setSelectedSensorId(newSensor.id);
		setFocusedSensorId(newSensor.id);
		setRightPanelMode('sensor_detail');
	}, [sensorPlacement]);

	// Cancel placement
	const handleCancelPlacement = useCallback(() => {
		sensorPlacement.cancelPending();
		setRightPanelMode(null);
	}, [sensorPlacement]);

	// ── Alert handler — called by MockAlertPanel ──────────────────────────────────

	const handleAlertFired = useCallback((alert: HaloAlertPayload) => {
		// 1. Find sensor by id
		const sensor = sensors.find(s => s.id === alert.sensor_id);
		if (!sensor) return;

		// 2. Find floor node
		const floor = findNodeById(areaTree, sensor.floor_id);
		if (!floor) return;

		const fw = floor.floor_width ?? 20;
		const fd = floor.floor_depth ?? 15;
		const fh = floor.floor_height ?? 3.0;
		const fy = floor.offset_z ?? 0;

		// Derive intensity from severity — overrides whatever slider says
		const severityToIntensity: any = {
			INFO: 1.0,
			WARNING: 2.5,
			CRITICAL: 5.0,
		};
		const intensity = severityToIntensity[alert.severity] ?? alert.intensity;

		// 3. Denormalize sensor position to world coords
		const wx = sensor.x_val * fw - fw / 2;
		const wz = sensor.y_val * fd - fd / 2;
		const wy = fy + sensor.z_val * fh;

		// 4. Register emit
		const emitId = Date.now();
		setActiveEmits(prev => [...prev, {
			id: emitId,
			position: [wx, wy, wz],
			eventSource: alert.event_source,
			intensity,
		}]);

		// 5. Focus sensor + select its floor
		setFocusedSensorId(sensor.id);
		setSelectedFloorId(sensor.floor_id);
		setSceneLevel('floor');

		// 6. Animate camera to sensor
		const cc = cameraControlsRef.current;
		if (cc) {
			cc.setPosition(wx + 12, wy + 10, wz + 12, true);
			cc.setTarget(wx, wy, wz, true);
		}

		// 7. Update sensor status in local state to alert
		setSensors(prev => prev.map(s =>
			s.id === sensor.id
				? {
					...s,
					sensor_status: 'alert',
					halo_color: alert.severity === 'INFO'
						? '#f59e0b'
						: '#e63946',
					halo_intensity: intensity / 5.0, // normalize to 0–1
					halo_radius: 5 + (intensity / 5.0) * 4, // 5m → 9m
				}
				: s
		));
	}, [sensors, areaTree]);

	// ── Emit complete handler ─────────────────────────────────────────────────────

	const handleEmitComplete = useCallback((id: number) => {
		setActiveEmits(prev => prev.filter(e => e.id !== id));
	}, []);

	// ── Toolbar toggles ───────────────────────────────────────────────────────

	const handleWallDrawToggle = useCallback(() => {
		if (!selectedFloorId) return;
		if (rightPanelMode === 'wall_draw') {
			setRightPanelMode(null);
			wallDrawing.cancelDrawing();
		} else {
			setRightPanelMode('wall_draw');
			wallDrawing.startDrawing();
		}
	}, [rightPanelMode, selectedFloorId, wallDrawing]);

	const handleImageToggle = useCallback(() => {
		if (!selectedFloorId) return;
		wallDrawing.cancelDrawing();
		setRightPanelMode(prev =>
			prev === 'image_upload' ? null : 'image_upload'
		);
	}, [selectedFloorId, wallDrawing]);

	const handleSensorToggle = useCallback(() => {
		handleSensorPlaceToggle();
	}, [handleSensorPlaceToggle]);

	// ── Active walls for current floor ────────────────────────────────────────

	const activeWalls = useMemo(() => {
		if (!selectedFloorId) return [];
		return [
			...(wallsByFloor[selectedFloorId] ?? []),
			...wallDrawing.drawnWalls,
		];
	}, [selectedFloorId, wallsByFloor, wallDrawing.drawnWalls]);

	// ── Breadcrumb label ──────────────────────────────────────────────────────

	const breadcrumb = useMemo(() => {
		if (selectedArea) return selectedArea.name;
		if (selectedFloor) return selectedFloor.name;
		if (selectedBuilding) return selectedBuilding.name;
		return null;
	}, [selectedArea, selectedFloor, selectedBuilding]);

	// ── Camera initial position ───────────────────────────────────────────────
	const initCamPos: [number, number, number] = [0, 80, 80];

	return (
		<div className={styles.page}>

			{/* ── Topbar ─────────────────────────────────────────────────── */}
			<div className={styles.topbar}>
				<div className={styles.topbarLeft}>
					<button
						className={`${styles.iconBtn} ${showSidebar ? styles.active : ''}`}
						onClick={() => setShowSidebar(s => !s)}
						title="Toggle Explorer"
					>☰</button>
					<span className={styles.title}>Halo Sensor Placement</span>
					{breadcrumb && (
						<span className={styles.breadcrumb}>— {breadcrumb}</span>
					)}
				</div>

				<div className={styles.topbarCenter}>
					{/* Tools only shown at floor / area level */}
					{(sceneLevel === 'floor' || sceneLevel === 'area') && (
						<div className={styles.toolPill}>
							<button
								className={`${styles.toolBtn}
                                    ${rightPanelMode === 'wall_draw'
										? styles.toolActive : ''}`}
								onClick={handleWallDrawToggle}
								title="Draw Walls"
							>✏️</button>
							<button
								className={`${styles.toolBtn}
                                    ${rightPanelMode === 'image_upload'
										? styles.toolActive : ''}`}
								onClick={handleImageToggle}
								title="Upload Floor Plan"
							>🗺️</button>
							<button
								className={`${styles.toolBtn}
                                    ${rightPanelMode === 'sensor_place'
										? styles.toolActive : ''}`}
								onClick={handleSensorToggle}
								title="Place Sensors"
							>📡</button>
						</div>
					)}
				</div>

				<div className={styles.topbarRight}>
					<button
						className={`${styles.iconBtn} ${showMockPanel ? styles.active : ''}`}
						onClick={() => setShowMockPanel(s => !s)}
						title="Alert Simulator"
					>
						🐛
					</button>
					<span className={styles.versionBadge}>v1.0</span>
				</div>
			</div>

			<div className={styles.layout}>

				{/* Sidebar */}
				{showSidebar && (
					<HaloSidebar
						root={areaTree}
						selectedBuildingId={selectedBuildingId}
						selectedFloorId={selectedFloorId}
						selectedAreaId={selectedAreaId}
						onSelectSite={handleSelectSite}
						onSelectBuilding={handleSelectBuilding}
						onSelectFloor={handleSelectFloor}
						onSelectArea={handleSelectArea}
					/>
				)}

				{/* Canvas */}
				<div
					className={styles.canvasWrapper}
					style={{
						cursor: wallDrawing.isDrawing
							? 'crosshair' : 'default',
					}}
				>
					<Canvas
						shadows
						dpr={[1, 2]}
						gl={{ antialias: true, alpha: true }}
					>
						<PerspectiveCamera
							makeDefault
							position={initCamPos}
							fov={45}
						/>
						<CameraControls
							ref={cameraControlsRef}
							makeDefault
							minDistance={5}
							maxDistance={300}
							dollyToCursor
						/>
						<ZoomOnlyWhenLocked locked={wallDrawing.isDrawing} />
						<GizmoHelper
							alignment="bottom-right"
							margin={[80, 80]}
						>
							<GizmoViewcube
								font="bold 12px Inter, sans-serif"
								color="#2a3a4a"
								textColor="#ffffff"
								hoverColor="#3a4a5a"
								opacity={0.85}
							/>
						</GizmoHelper>
						<Environment preset="city" />

						<Suspense fallback={null}>
							<HaloFloorScene
								sceneLevel={sceneLevel}
								areaTree={areaTree}
								selectedBuilding={selectedBuilding}
								selectedFloor={selectedFloor}
								selectedAreaId={selectedAreaId}
								wallsByFloor={wallsByFloor}
								activeWalls={activeWalls}
								sensors={sensors}
								drawing={wallDrawing}
								focusedSensorId={focusedSensorId}
								setFocusedSensorId={setFocusedSensorId}
								isPlacing={sensorPlacement.isPlacing}
								placementPreview={sensorPlacement.preview}
								onSensorPlaced={handleSensorPlaced}
								onSensorClick={handleSensorClick}
								onUpdatePlacementPreview={sensorPlacement.updatePreview}
								blinkingWallIds={blinkingWallIds}
							/>
						</Suspense>

						{activeEmits.map(emit => (
							<SensorAlertEmit
								key={emit.id}
								id={emit.id}
								position={emit.position}
								eventSource={emit.eventSource}
								intensity={emit.intensity}
								onComplete={handleEmitComplete}
							/>
						))}
					</Canvas>

					{/* Drawing banner */}
					{wallDrawing.isDrawing && (
						<div className={styles.drawingBanner}>
							Wall Drawing Mode
							<span className={styles.drawingHint}>
								Click · Double-click to close · ESC to cancel
							</span>
						</div>
					)}

					{sensorPlacement.isPlacing && (
						<div className={styles.drawingBanner} style={{
							background: 'rgba(6, 214, 160, 0.12)',
							borderColor: 'rgba(6, 214, 160, 0.45)',
							color: '#06d6a0',
						}}>
							📡 Sensor Placement Mode
							<span className={styles.drawingHint}>
								Move mouse over floor · Click to place sensor
							</span>
						</div>
					)}

				</div>

				{/* Right panel */}
				<HaloRightPanel
					mode={rightPanelMode}
					selectedFloor={selectedFloor}
					drawing={wallDrawing}
					sensors={placedSensors}
					unplacedSensors={unplacedSensors}
					onSaveWalls={handleSaveWalls}
					onImageUpload={handleImageUpload}
					onImageRemove={handleImageRemove}
					onStartPlacing={handleStartPlacingFromPanel}
					onPlaceExisting={handleStartPlacingSpecific}
					onAddSensor={handleAddSensor}
					onRemoveSensor={handleRemoveSensor}
					selectedSensor={selectedSensor}
					pendingSensor={sensorPlacement.pendingSensor}
					isPlacing={sensorPlacement.isPlacing}
					pendingUnplacedId={pendingUnplacedId}
					onConfirmPlacement={handleConfirmPlacement}
					onCancelPlacement={handleCancelPlacement}
					onClose={() => {
						setRightPanelMode(null);
						wallDrawing.cancelDrawing();
						sensorPlacement.cancelPlacing();
						sensorPlacement.cancelPending();
						setPendingUnplacedId(null);
						setSelectedAreaId(null);
						setBlinkingWallIds([]);
					}}
				/>

				{showMockPanel && (
					<MockAlertPanel
						sensors={sensors}
						onFire={handleAlertFired}
						onClose={() => setShowMockPanel(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default HaloPage;