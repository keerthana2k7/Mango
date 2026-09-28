import React, { useState, useMemo } from 'react';
import { Tree, FarmLayout } from '../../types';
import { Text, Billboard } from '@react-three/drei';

interface MangoTrees3DProps {
  layout: FarmLayout | null;
  trees: Tree[];
  currentTreeId?: number | null;
  selectedTreeId?: number | null;
  onSelectTree: (tree: Tree) => void;
}

export const MangoTrees3D: React.FC<MangoTrees3DProps> = ({
  layout,
  trees,
  currentTreeId,
  selectedTreeId,
  onSelectTree,
}) => {
  const width = layout?.dimensions.width_meters || 120;
  const height = layout?.dimensions.height_meters || 90;
  const halfW = width / 2;
  const halfH = height / 2;

  const [hoveredTreeId, setHoveredTreeId] = useState<number | null>(null);

  // Map of trees by ID for live health status
  const treeMap = useMemo(() => {
    const map = new Map<number, Tree>();
    trees.forEach((t) => map.set(t.id, t));
    return map;
  }, [trees]);

  // Fallback row definition if layout is still loading
  const rows = useMemo(() => {
    if (layout?.rows && layout.rows.length > 0) return layout.rows;
    const defaultRows = [];
    for (let r = 1; r <= 4; r++) {
      const rowY = 16.0 + (r - 1) * 22.0;
      const rowTrees = [];
      for (let c = 1; c <= 6; c++) {
        const treeX = 15.0 + (c - 1) * 18.0;
        rowTrees.push({
          tree_id: (r - 1) * 6 + c,
          tree_number: `T-R0${r}-C0${c}`,
          row: r,
          column: c,
          x: treeX,
          y: rowY,
          health_status: (r + c) % 5 === 0 ? 'DISEASE_DETECTED' : 'HEALTHY',
          variety: 'Alphonso',
        });
      }
      defaultRows.push({
        row_number: r,
        rail_y: rowY,
        start_x: 9.0,
        end_x: 111.0,
        trees: rowTrees,
      });
    }
    return defaultRows;
  }, [layout]);

  return (
    <group>
      {rows.flatMap((row) =>
        row.trees.map((tree) => {
          const liveTree = treeMap.get(tree.tree_id);
          const health = liveTree?.health_status || tree.health_status;
          const isHealthy = health === 'HEALTHY';
          const isDiseased = health === 'DISEASE_DETECTED';
          const isTreated = health === 'TREATED';
          const isInspected = currentTreeId === tree.tree_id;
          const isSelected = selectedTreeId === tree.tree_id;
          const isHovered = hoveredTreeId === tree.tree_id;

          // 3D coordinates (centered in Three.js world)
          const posX = tree.x - halfW;
          const posZ = tree.y - halfH;

          // Canopy color palette
          const primaryCanopyColor = isHealthy
            ? '#2E7D32'
            : isTreated
            ? '#00796B'
            : isDiseased
            ? '#6D4C41'
            : '#4B6B48';

          const secondaryCanopyColor = isHealthy
            ? '#43A047'
            : isTreated
            ? '#26A69A'
            : isDiseased
            ? '#D84315'
            : '#668763';

          const scale = isHovered ? 1.12 : isInspected ? 1.08 : 1.0;

          return (
            <group
              key={`tree-3d-${tree.tree_id}`}
              position={[posX, 0, posZ]}
              scale={[scale, scale, scale]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredTreeId(tree.tree_id);
              }}
              onPointerOut={() => setHoveredTreeId(null)}
              onClick={(e) => {
                e.stopPropagation();
                const targetObj = liveTree || {
                  id: tree.tree_id,
                  farm_id: layout?.farm_id || 1,
                  tree_number: tree.tree_number,
                  row_number: tree.row,
                  column_number: tree.column,
                  variety: tree.variety,
                  health_status: tree.health_status as any,
                };
                onSelectTree(targetObj);
              }}
            >
              {/* 1. Ground Status Halo & Health Ring */}
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.2, 2.9, 32]} />
                <meshBasicMaterial
                  color={
                    isSelected
                      ? '#0284C7'
                      : isInspected
                      ? '#F59E0B'
                      : isTreated
                      ? '#0D9488'
                      : isDiseased
                      ? '#E11D48'
                      : '#10B981'
                  }
                  transparent
                  opacity={isInspected ? 0.95 : isSelected ? 0.85 : 0.45}
                />
              </mesh>

              {/* Pulsing Inspection Radar Wave on Ground */}
              {isInspected && (
                <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[2.9, 3.6, 32]} />
                  <meshBasicMaterial color="#F59E0B" transparent opacity={0.7} />
                </mesh>
              )}

              {/* 2. Wooden Tree Trunk & Roots */}
              <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.35, 0.55, 2.0, 14]} />
                <meshStandardMaterial color="#4A3525" roughness={0.9} />
              </mesh>
              {/* Tree Base Root Flare */}
              <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.55, 0.75, 0.4, 12]} />
                <meshStandardMaterial color="#3E2C1E" roughness={0.95} />
              </mesh>

              {/* 3. Lush Multi-layered Mango Tree Canopy */}
              {/* Main Center Canopy Dome */}
              <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
                <sphereGeometry args={[2.2, 16, 16]} />
                <meshStandardMaterial color={primaryCanopyColor} roughness={0.65} />
              </mesh>

              {/* Foliage Cluster 1 (North-East) */}
              <mesh position={[0.9, 3.5, 0.7]} castShadow receiveShadow>
                <sphereGeometry args={[1.5, 14, 14]} />
                <meshStandardMaterial color={secondaryCanopyColor} roughness={0.6} />
              </mesh>

              {/* Foliage Cluster 2 (South-West) */}
              <mesh position={[-0.8, 3.4, -0.8]} castShadow receiveShadow>
                <sphereGeometry args={[1.6, 14, 14]} />
                <meshStandardMaterial color={primaryCanopyColor} roughness={0.7} />
              </mesh>

              {/* Foliage Cluster 3 (Top Crown) */}
              <mesh position={[0, 4.4, 0]} castShadow receiveShadow>
                <sphereGeometry args={[1.3, 12, 12]} />
                <meshStandardMaterial color={secondaryCanopyColor} roughness={0.55} />
              </mesh>

              {/* 4. Hanging Mango Fruits (Yellow/Orange Alphonso Mangoes) */}
              <mesh position={[0.8, 2.5, 0.8]} castShadow>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshStandardMaterial color="#F59E0B" roughness={0.4} />
              </mesh>
              <mesh position={[-0.7, 2.4, 0.9]} castShadow>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshStandardMaterial color="#EA580C" roughness={0.4} />
              </mesh>
              <mesh position={[0.6, 2.6, -0.9]} castShadow>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshStandardMaterial color="#F59E0B" roughness={0.4} />
              </mesh>
              <mesh position={[-0.9, 2.5, -0.6]} castShadow>
                <sphereGeometry args={[0.18, 8, 8]} />
                <meshStandardMaterial color="#EA580C" roughness={0.4} />
              </mesh>

              {/* 5. Floating Billboard Tree Number Tag */}
              <Billboard position={[0, 5.8, 0]}>
                <Text
                  fontSize={0.65}
                  color={isDiseased ? '#E11D48' : '#0F172A'}
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                  outlineWidth={0.08}
                  outlineColor="#FFFFFF"
                >
                  {`Tree ${tree.column}`}
                </Text>
              </Billboard>
            </group>
          );
        })
      )}
    </group>
  );
};
