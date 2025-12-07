
import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, Stars, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import Tree from './Tree';
import UniverseEffect from './UniverseEffect';
import MilkyWay from './MilkyWay';
import FortuneGame from './FortuneGame';
import Nebula from './Nebula';

interface SceneProps {
  wishMode: boolean;
  gameMode: boolean;
  onGameCollect?: (count: number) => void;
  onGameFinish?: () => void;
}

const Scene: React.FC<SceneProps> = ({ wishMode, gameMode, onGameCollect, onGameFinish }) => {
  // dynamic camera adjustment for mobile
  const [cameraZ, setCameraZ] = useState(22);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      // If mobile portrait, move camera back significantly to fit the tree width (radius ~4.5)
      // Desktop: 22, Mobile Portrait: 38
      setCameraZ(width < 768 || isPortrait ? 38 : 22);
    };

    // Set initial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-full bg-[#020510] relative"> {/* Deep Midnight Blue */}
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
            {/* Camera Setup: Dynamic Z based on screen size */}
            <PerspectiveCamera makeDefault position={[0, 0, cameraZ]} fov={40} />
            
            {/* 
                OrbitControls Configuration:
                - When gameMode is ACTIVE: Unlock vertical angles (0 to PI) so user can search universe.
                - When gameMode is INACTIVE: Restrict vertical angles (PI/4 to PI/1.8) to keep focus on tree.
            */}
            <OrbitControls 
                minPolarAngle={gameMode ? 0 : Math.PI / 4} 
                maxPolarAngle={gameMode ? Math.PI : Math.PI / 1.8}
                enablePan={false}
                minDistance={15}
                maxDistance={45}
                autoRotate={!gameMode} // Stop rotation during game so user can click easier
                autoRotateSpeed={wishMode ? 0.8 : 0.3} // Spin faster when wishing
            />

            {/* --- Cinematic Lighting Setup --- */}
            
            {/* 1. Main Key Light (Warm Gold) */}
            <spotLight
              position={[10, 10, 10]}
              angle={0.3}
              penumbra={0.5}
              intensity={80}
              castShadow
              shadow-mapSize={2048}
              color="#ffddaa"
            />

            {/* 2. Rim Light (Cool Blue/White) - slightly boosted for blue theme */}
            <spotLight
              position={[0, 10, -15]}
              angle={0.6}
              penumbra={1}
              intensity={180}
              color="#aaddff"
            />

            {/* 3. Fill Light (Subtle Purple/Blue) */}
            <pointLight position={[-10, 0, 5]} intensity={30} color="#334488" />

            {/* 4. Ambient Base */}
            <ambientLight intensity={0.15} />

            {/* Environment */}
            <Environment preset="city" environmentIntensity={0.5} />

            {/* Background Elements */}
            {/* The new Milky Way Galaxy Band */}
            <MilkyWay />
            
            {/* Subtle procedural Nebula fog - Only visible when NOT playing game to keep finding items easy */}
            {!gameMode && <Nebula />}
            
            {/* Subtle distant stars for extra depth, cool white colors */}
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
            
            {/* The Main Content */}
            {/* When Game Mode is active, the tree "explodes" */}
            <Tree exploded={gameMode} />

            {/* The Universe Effect (Particle Explosion) */}
            {/* Also active during game for extra chaos */}
            <UniverseEffect active={wishMode || gameMode} />

            {/* The Interactive Game Layer */}
            <FortuneGame 
                active={gameMode} 
                onCollect={onGameCollect || (() => {})} 
                onFinish={onGameFinish || (() => {})} 
            />
            
            <ContactShadows 
                opacity={0.7} 
                scale={20} 
                blur={2.5} 
                far={4} 
                resolution={256} 
                color="#000000" 
                position={[0, -6.5, 0]}
            />

            {/* Post Processing */}
            <EffectComposer enableNormalPass={false}>
              <Bloom 
                luminanceThreshold={0.6} 
                mipmapBlur 
                intensity={1.2} 
                radius={0.5}
                levels={8}
              />
              <Vignette eskil={false} offset={0.1} darkness={0.7} />
              <Noise opacity={0.03} /> 
            </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene;
