import React from 'react';
import { FarmLayout } from '../../types';
import { Text } from '@react-three/drei';

interface OrchardTerrain3DProps {
  layout: FarmLayout | null;
}

export const OrchardTerrain3D: React.FC<OrchardTerrain3DProps> = ({ layout }) => {
  const width = layout?.dimensions.width_meters || 120;
  const height = layout?.dimensions.height_meters || 90;

  const halfW = width / 2;
  const halfH = height / 2;

  return (
    <group>
      {/* 1. Main Surrounding Landscape Ground */}
      <mesh receiveShadow position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 80, height + 80]} />
        <meshStandardMaterial color="#607658" roughness={0.9} />
      </mesh>

      {/* 2. Inner Orchard Plot Grass Plate */}
      <mesh receiveShadow position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 12, height + 12]} />
        <meshStandardMaterial color="#7B936B" roughness={0.8} />
      </mesh>

      {/* 3. Perimeter Farm Access Road (Gravel / Sandy track matching Reference 3) */}
      {/* North Road */}
      <mesh receiveShadow position={[0, 0.02, -halfH - 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 16, 5]} />
        <meshStandardMaterial color="#C4B59D" roughness={0.95} />
      </mesh>
      {/* South Road */}
      <mesh receiveShadow position={[0, 0.02, halfH + 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 16, 5]} />
        <meshStandardMaterial color="#C4B59D" roughness={0.95} />
      </mesh>
      {/* West Road */}
      <mesh receiveShadow position={[-halfW - 4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, height + 16]} />
        <meshStandardMaterial color="#C4B59D" roughness={0.95} />
      </mesh>
      {/* East Road */}
      <mesh receiveShadow position={[halfW + 4, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, height + 16]} />
        <meshStandardMaterial color="#C4B59D" roughness={0.95} />
      </mesh>

      {/* 4. Rich Agricultural Loam Beds under each Orchard Row */}
      {layout?.rows.map((row) => {
        const rowZ = row.rail_y - halfH;
        const rowLen = row.end_x - row.start_x + 8;
        const rowCenterX = (row.start_x + row.end_x) / 2 - halfW;

        return (
          <group key={row.row_number}>
            {/* Dark soil bed */}
            <mesh
              receiveShadow
              position={[rowCenterX, 0.04, rowZ]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[rowLen, 7]} />
              <meshStandardMaterial color="#5C4D3C" roughness={0.95} />
            </mesh>

            {/* 3D Row Marker Sign */}
            <group position={[row.start_x - halfW - 4, 0, rowZ]}>
              {/* Wooden post */}
              <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 1.6]} />
                <meshStandardMaterial color="#8D6E63" roughness={0.9} />
              </mesh>
              {/* Signboard */}
              <mesh position={[0, 1.4, 0]} castShadow>
                <boxGeometry args={[2.4, 0.7, 0.1]} />
                <meshStandardMaterial color="#064E3B" roughness={0.6} />
              </mesh>
              <Text
                position={[0, 1.4, 0.06]}
                fontSize={0.28}
                color="#FFFFFF"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`ROW 0${row.row_number}`}
              </Text>
            </group>
          </group>
        );
      })}

      {/* 5. 3D Farm Boundary Fence (Posts & Wire) */}
      <group>
        {/* Corner boundary posts */}
        {[
          [-halfW - 6, -halfH - 6],
          [halfW + 6, -halfH - 6],
          [halfW + 6, halfH + 6],
          [-halfW - 6, halfH + 6],
        ].map(([px, pz], idx) => (
          <mesh key={idx} position={[px, 1.0, pz]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 2.0]} />
            <meshStandardMaterial color="#047857" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
