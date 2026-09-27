import React, { useMemo } from 'react';
import { FarmLayout } from '../../types';

interface CameraRail3DProps {
  layout: FarmLayout | null;
}

export const CameraRail3D: React.FC<CameraRail3DProps> = ({ layout }) => {
  const width = layout?.dimensions.width_meters || 120;
  const height = layout?.dimensions.height_meters || 90;
  const halfW = width / 2;
  const halfH = height / 2;
  const railElevation = 5.6;

  // Fallback row layout if loading
  const rows = useMemo(() => {
    if (layout?.rows && layout.rows.length > 0) return layout.rows;
    const defaultRows = [];
    for (let r = 1; r <= 4; r++) {
      const rowY = 16.0 + (r - 1) * 22.0;
      defaultRows.push({
        row_number: r,
        rail_y: rowY,
        start_x: 9.0,
        end_x: 111.0,
        trees: [],
      });
    }
    return defaultRows;
  }, [layout]);

  return (
    <group>
      {rows.map((row) => {
        const rowZ = row.rail_y - halfH;
        const startX = row.start_x - halfW;
        const endX = row.end_x - halfW;
        const trackLen = endX - startX;
        const trackCenterX = (startX + endX) / 2;

        return (
          <group key={`rail-3d-${row.row_number}`}>
            {/* ================= 1. Left Gantry Support Tower (West) ================= */}
            <group position={[startX, 0, rowZ]}>
              {/* Twin Aluminum Uprights */}
              <mesh position={[-0.3, railElevation / 2, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, railElevation, 10]} />
                <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
              </mesh>
              <mesh position={[0.3, railElevation / 2, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, railElevation, 10]} />
                <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
              </mesh>
              {/* Top Support Crossbeam */}
              <mesh position={[0, railElevation - 0.2, 0]} castShadow>
                <boxGeometry args={[1.2, 0.3, 0.8]} />
                <meshStandardMaterial color="#334155" metalness={0.85} />
              </mesh>
              {/* Concrete Foundation Footing */}
              <mesh position={[0, 0.2, 0]} receiveShadow>
                <boxGeometry args={[1.8, 0.4, 1.4]} />
                <meshStandardMaterial color="#94A3B8" roughness={0.9} />
              </mesh>
            </group>

            {/* ================= 2. Right Gantry Support Tower (East) ================= */}
            <group position={[endX, 0, rowZ]}>
              {/* Twin Aluminum Uprights */}
              <mesh position={[-0.3, railElevation / 2, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, railElevation, 10]} />
                <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
              </mesh>
              <mesh position={[0.3, railElevation / 2, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, railElevation, 10]} />
                <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
              </mesh>
              {/* Top Support Crossbeam */}
              <mesh position={[0, railElevation - 0.2, 0]} castShadow>
                <boxGeometry args={[1.2, 0.3, 0.8]} />
                <meshStandardMaterial color="#334155" metalness={0.85} />
              </mesh>
              {/* Concrete Foundation Footing */}
              <mesh position={[0, 0.2, 0]} receiveShadow>
                <boxGeometry args={[1.8, 0.4, 1.4]} />
                <meshStandardMaterial color="#94A3B8" roughness={0.9} />
              </mesh>
            </group>

            {/* ================= 3. Dual Parallel Steel Tubular Rails ================= */}
            {/* North Rail */}
            <mesh position={[trackCenterX, railElevation, rowZ - 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, trackLen, 12]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.95} />
            </mesh>
            {/* South Rail */}
            <mesh position={[trackCenterX, railElevation, rowZ + 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, trackLen, 12]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.2} metalness={0.95} />
            </mesh>

            {/* ================= 4. Gantry Cross Ties ================= */}
            {Array.from({ length: 20 }).map((_, i) => {
              const tieX = startX + (i + 0.5) * (trackLen / 20);
              return (
                <mesh key={i} position={[tieX, railElevation, rowZ]}>
                  <boxGeometry args={[0.15, 0.1, 0.85]} />
                  <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.7} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};
