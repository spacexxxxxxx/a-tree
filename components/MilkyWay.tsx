import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MilkyWay: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const parameters = {
    count: 25000,     // Increased count for a dense "cloud" look
    radius: 90,       // Large sphere radius
    bandWidth: 0.25,  // How narrow the band is (Gaussian spread)
    colors: {
        core: '#E0F6FF',   // Bright White/Cyan center
        mid: '#4DA6FF',    // Vibrant Blue
        edge: '#0A1A3A',   // Deep Midnight Blue
    }
  };

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);

    const colorCore = new THREE.Color(parameters.colors.core);
    const colorMid = new THREE.Color(parameters.colors.mid);
    const colorEdge = new THREE.Color(parameters.colors.edge);

    for (let i = 0; i < parameters.count; i++) {
      const i3 = i * 3;

      // Spherical distribution concentrated at the equator (Phi = PI/2)
      // This creates a "Band" or "Ring" look which we will then tilt
      
      const r = parameters.radius + (Math.random() - 0.5) * 10; // Slight depth variation
      const theta = Math.random() * Math.PI * 2; // Full circle around Y
      
      // Gaussian distribution around PI/2 for the band thickness
      // Use Box-Muller transform for normal distribution or simple approximation
      const randNormal = (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2; // approx normal -1 to 1
      const phi = Math.PI / 2 + randNormal * parameters.bandWidth; 

      // Spherical to Cartesian conversion
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi); // Y is "up" in the band's local space (thickness)
      const z = r * Math.sin(phi) * Math.sin(theta);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Color mapping based on distance from equator (phi deviation)
      const distFromCenter = Math.abs(phi - Math.PI / 2) / parameters.bandWidth; // 0 to ~1
      
      const particleColor = new THREE.Color();
      
      // Mix colors: Core -> Mid -> Edge
      if (distFromCenter < 0.3) {
          particleColor.copy(colorCore).lerp(colorMid, distFromCenter / 0.3);
      } else {
          particleColor.copy(colorMid).lerp(colorEdge, (distFromCenter - 0.3) / 0.7);
      }
      
      // Add some noise/variation
      particleColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

      colors[i3] = particleColor.r;
      colors[i3 + 1] = particleColor.g;
      colors[i3 + 2] = particleColor.b;
    }

    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow rotation of the sky
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.005;
    }
  });

  return (
    // Tilt the band 45 degrees to make it diagonal across the screen
    <group rotation={[Math.PI / 4, 0, Math.PI / 6]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={parameters.count}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={parameters.count}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.25}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors={true}
          transparent={true}
          opacity={0.8}
        />
      </points>
    </group>
  );
};

export default MilkyWay;