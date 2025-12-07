
import React, { useMemo, useRef } from 'react';
import { Vector3, Euler, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { PALETTE, ShapeType, TreeItemData } from '../types';
import Ornament from './Ornament';
import TreeTopper from './TreeTopper';

interface TreeProps {
    exploded?: boolean;
}

const Tree: React.FC<TreeProps> = ({ exploded = false }) => {
  const groupRef = useRef<Group>(null);
  const targetScale = useRef(1);

  // Procedurally generate the tree items
  const items: TreeItemData[] = useMemo(() => {
    const tempItems: TreeItemData[] = [];
    const treeHeight = 12;
    const baseRadius = 4.5;
    const count = 750; // Increased count for density

    for (let i = 0; i < count; i++) {
      // Normalized height (0 at bottom, 1 at top)
      const t = i / count;
      
      // Height calculation
      const y = t * treeHeight;
      
      // Radius calculation (cone shape) with some variation
      const radius = MathUtils.lerp(baseRadius, 0.2, t);
      
      // Spiral angle - tighter spiral for more density
      const angle = t * Math.PI * 45; 
      
      // Add randomness to position to make it look "piled"
      const randomOffset = 0.3; // Reduced offset for tighter packing
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * randomOffset;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * randomOffset;

      // Determine Type and Color rules
      const isSphere = Math.random() > 0.4; 
      let type = isSphere ? ShapeType.SPHERE : ShapeType.CUBE;
      let color = PALETTE.GOLD;

      if (isSphere) {
        color = Math.random() > 0.4 ? PALETTE.GOLD : PALETTE.RED;
        if (Math.random() > 0.8) color = PALETTE.DEEP_GOLD; 
      } else {
        color = Math.random() > 0.5 ? PALETTE.DARK_GREEN : PALETTE.GOLD;
        if (Math.random() > 0.8) color = PALETTE.GREEN;
      }

      // Random Rotation
      const rotation = new Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Scale decreases towards top - reduced overall scale
      const baseScale = MathUtils.lerp(0.7, 0.35, t); 
      const scale = baseScale * (0.8 + Math.random() * 0.4);

      tempItems.push({
        id: i,
        position: new Vector3(x, y - treeHeight / 2, z), 
        rotation,
        scale,
        type,
        color
      });
    }
    return tempItems;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Very slow rotation of the entire tree
      groupRef.current.rotation.y += delta * 0.1;

      // Handle Explosion Scale
      const scaleGoal = exploded ? 25 : 1; 
      // Lerp current scale to target
      targetScale.current = MathUtils.lerp(targetScale.current, scaleGoal, delta * 2);
      
      groupRef.current.scale.setScalar(targetScale.current);
    }
  });

  return (
    <group ref={groupRef}>
      {/* The Geometric Body */}
      {items.map((item) => (
        <Ornament key={item.id} data={item} exploded={exploded} />
      ))}
      
      {/* The Topper - Moved up to 6.8 to clear the ornaments (Tree top is 6.0 + overlap) */}
      <TreeTopper position={[0, 6.8, 0]} exploded={exploded} />

      {/* Internal warm glow lights to simulate lights inside the tree */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#ffaa00" distance={8} decay={2} />
      <pointLight position={[0, 3, 0]} intensity={3} color="#ffaa00" distance={8} decay={2} />
      <pointLight position={[0, -3, 0]} intensity={3} color="#ffaa00" distance={8} decay={2} />
    </group>
  );
};

export default Tree;
