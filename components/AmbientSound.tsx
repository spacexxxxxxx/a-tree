import React, { useEffect, useRef } from 'react';

interface AmbientSoundProps {
  active: boolean; // "Wish Mode" active state
}

// A Major Pentatonic Scale frequencies (High octave for sparkles)
const SCALE = [
  880.00,  // A5
  987.77,  // B5
  1108.73, // C#6
  1318.51, // E6
  1479.98, // F#6
  1760.00  // A6
];

const AmbientSound: React.FC<AmbientSoundProps> = ({ active }) => {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOscsRef = useRef<OscillatorNode[]>([]);
  const activeRef = useRef(active);

  // Keep a ref to active state for use inside closures/intervals
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    // 1. Initialize Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    ctxRef.current = ctx;

    // 2. Master Gain (Volume Control)
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0; // Start silent to fade in
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // 3. Delay Line (Cosmic Echo)
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.4; // 400ms echo
    
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3; // 30% feedback
    
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1500; // Dampen high freqs on echoes

    // Routing: Source -> Delay -> Filter -> Feedback -> Delay
    delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain); // Also send echo to master

    // 4. Drone Generators (Background Hum)
    const createDrone = (freq: number, type: OscillatorType, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.value = vol;
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start();
      return osc;
    };

    // Create a rich A Major chord texture (A2, E3, A3 slightly detuned)
    droneOscsRef.current = [
      createDrone(110.00, 'sine', 0.15),      // A2
      createDrone(110.50, 'sine', 0.15),      // A2 (Detuned for beating)
      createDrone(164.81, 'sine', 0.10),      // E3
      createDrone(55.00, 'triangle', 0.05),   // A1 (Sub bass)
    ];

    // 5. Chime Generator
    const playChime = () => {
      // Don't play if context is suspended (browser policy)
      if (ctx.state === 'suspended') return;

      const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      // Randomize Pan
      const panner = ctx.createStereoPanner();
      panner.pan.value = (Math.random() * 2) - 1; // -1 to 1

      // Routing: Osc -> Gain -> Panner -> Master & Delay
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(masterGain);
      panner.connect(delay); // Send to delay for space effect

      const now = ctx.currentTime;
      const attack = 0.02;
      const decay = 1.5 + Math.random(); // Random decay time

      // Envelope AD (Attack Decay)
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + attack); // Very quiet chimes
      gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay);

      osc.start(now);
      osc.stop(now + attack + decay + 0.1);
    };

    // 6. Chime Loop
    const interval = setInterval(() => {
      // Chance to play depends on active state
      // Active: High chance (busy); Idle: Low chance (calm)
      const chance = activeRef.current ? 0.7 : 0.2; 
      if (Math.random() < chance) {
        playChime();
      }
    }, 800); // Check every 800ms

    // 7. Interaction Listener (Autoplay Policy)
    const handleInteract = () => {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          // Fade in initial volume
          masterGain.gain.setTargetAtTime(0.05, ctx.currentTime, 1);
        });
      }
    };
    
    window.addEventListener('click', handleInteract);
    window.addEventListener('touchstart', handleInteract);
    window.addEventListener('keydown', handleInteract);

    // cleanup
    return () => {
      droneOscsRef.current.forEach(o => o.stop());
      clearInterval(interval);
      window.removeEventListener('click', handleInteract);
      window.removeEventListener('touchstart', handleInteract);
      window.removeEventListener('keydown', handleInteract);
      ctx.close();
    };
  }, []);

  // Effect: Handle Volume Swell when Active Mode changes
  useEffect(() => {
    if (!ctxRef.current || !masterGainRef.current) return;
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    
    // Safety check for context state
    if (ctx.state === 'suspended') return;

    const now = ctx.currentTime;
    // Target Volume: 0.05 (Idle) vs 0.2 (Active)
    const targetVol = active ? 0.2 : 0.05;
    
    // Smooth transition
    master.gain.setTargetAtTime(targetVol, now, 0.5); 
    
  }, [active]);

  return null;
};

export default AmbientSound;
