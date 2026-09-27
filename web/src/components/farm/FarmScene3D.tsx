import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { OrchardTerrain3D } from './OrchardTerrain3D';
import { MangoTrees3D } from './MangoTrees3D';
import { CameraRail3D } from './CameraRail3D';
import { CameraCarriage3D } from './CameraCarriage3D';
import { Tree, SimulationStatus, FarmLayout } from '../../types';

export type ViewMode = 'OVERVIEW' | 'FOLLOW' | 'FOCUS_TREE' | 'FREE';

interface FarmScene3DProps {
  layout: FarmLayout | null;
  trees: Tree[];
  simulationStatus: SimulationStatus | null;
  onSelectTree: (tree: Tree) => void;
  selectedTreeId?: number | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  resetTrigger: number;
}

// Internal 3D Scene content running inside R3F Canvas
const SceneContent: React.FC<{
  layout: FarmLayout | null;
  trees: Tree[];
  simulationStatus: SimulationStatus | null;
  onSelectTree: (tree: Tree) => void;
  selectedTreeId?: number | null;
  viewMode: ViewMode;
  resetTrigger: number;
}> = ({
  layout,
  trees,
  simulationStatus,
  onSelectTree,
  selectedTreeId,
  viewMode,
  resetTrigger,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const width = layout?.dimensions.width_meters || 120;
  const height = layout?.dimensions.height_meters || 90;
  const halfW = width / 2;
  const halfH = height / 2;

  // Real-world target coordinates derived from simulation status
  const targetX = (simulationStatus?.x ?? 15.0) - halfW;
  const targetZ = (simulationStatus?.y ?? 16.0) - halfH;
  const railY = 5.6;

  // Smooth interpolated trolley carriage position (60 FPS)
  const currentPos = useRef(new THREE.Vector3(targetX, railY, targetZ));
  const [carriagePos, setCarriagePos] = useState<[number, number, number]>([targetX, railY, targetZ]);

  // Handle Reset / Overview Trigger
  useEffect(() => {
    if (controlsRef.current) {
      camera.position.set(0, 42, 58);
      controlsRef.current.target.set(0, 3, 0);
      controlsRef.current.update();
    }
  }, [resetTrigger, camera]);

  // 60 FPS frame interpolation loop for camera carriage and follow mode
  useFrame((_, delta) => {
    const targetVec = new THREE.Vector3(targetX, railY, targetZ);
    // Smooth frame-rate independent linear interpolation
    currentPos.current.lerp(targetVec, Math.min(1.0, delta * 6.0));
    setCarriagePos([currentPos.current.x, currentPos.current.y, currentPos.current.z]);

    if (viewMode === 'FOLLOW' && controlsRef.current) {
      const followCamPos = new THREE.Vector3(
        currentPos.current.x,
        currentPos.current.y + 11,
        currentPos.current.z + 18
      );
      camera.position.lerp(followCamPos, Math.min(1.0, delta * 4.0));
      controlsRef.current.target.lerp(currentPos.current, Math.min(1.0, delta * 5.0));
      controlsRef.current.update();
    }
  });

  return (
    <>
      {/* 1. Atmosphere, Sun & Sky Lighting */}
      <Sky
        distance={450000}
        sunPosition={[100, 90, 80]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={1.2}
      />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#E0F2FE', '#2D4A27', 0.55]} />

      {/* Main Directional Sunlight with Shadows */}
      <directionalLight
        position={[60, 80, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0005}
      />

      {/* Subtle Orchard Fog */}
      <fog attach="fog" args={['#EDF5EE', 50, 180]} />

      {/* 2. 3D Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={130}
        maxPolarAngle={Math.PI / 2 - 0.04} // Keep camera above ground
      />

      {/* 3. 3D Terrain, Soil Beds & Roads */}
      <OrchardTerrain3D layout={layout} />

      {/* 4. 3D Overhead Serpentine Rail Gantry */}
      <CameraRail3D layout={layout} />

      {/* 5. 3D Mango Trees with Lush Foliage, Fruits & Health Halos */}
      <MangoTrees3D
        layout={layout}
        trees={trees}
        currentTreeId={simulationStatus?.current_tree_id}
        selectedTreeId={selectedTreeId}
        onSelectTree={onSelectTree}
      />

      {/* 6. 3D Robotic Camera Trolley Carriage with Lens & Laser Scanning Animation */}
      <CameraCarriage3D position={carriagePos} simulationStatus={simulationStatus} />
    </>
  );
};

export const FarmScene3D: React.FC<FarmScene3DProps> = ({
  layout,
  trees,
  simulationStatus,
  onSelectTree,
  selectedTreeId,
  viewMode,
  onViewModeChange,
  resetTrigger,
}) => {
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 42, 58], fov: 46 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <SceneContent
          layout={layout}
          trees={trees}
          simulationStatus={simulationStatus}
          onSelectTree={onSelectTree}
          selectedTreeId={selectedTreeId}
          viewMode={viewMode}
          resetTrigger={resetTrigger}
        />
      </Canvas>
    </div>
  );
};
