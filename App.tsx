
import React, { Suspense, useState, useEffect } from 'react';
import Scene from './components/Scene';
import { Loader } from '@react-three/drei';
import { GoogleGenAI } from "@google/genai";

type WishStage = 'idle' | 'input' | 'loading' | 'result';

// Move PremiumButton outside to prevent re-mounting on every render
const PremiumButton = ({ onClick, label, icon }: { onClick: () => void, label: string, icon?: string }) => (
  <button 
    onClick={onClick}
    className="group relative overflow-hidden transition-all duration-500 ease-out"
  >
    {/* Button Background Gradient */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#FBF5B7] to-[#BF953F] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    {/* Button Border */}
    <div className="absolute inset-0 border border-yellow-500/30 group-hover:border-transparent transition-colors duration-500"></div>

    <div className="relative px-5 md:px-6 py-2.5 md:py-3 flex items-center gap-2">
       <span className="font-['Bodoni_Moda'] text-yellow-100 text-[10px] md:text-xs tracking-[0.2em] uppercase group-hover:text-[#020202] transition-colors duration-500 font-semibold">
         {label}
       </span>
       {icon && (
         <span className="text-yellow-500 group-hover:text-[#020202] text-sm transition-colors duration-500">{icon}</span>
       )}
    </div>
    
    {/* Shimmer Effect */}
    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
  </button>
);

// Move styles outside or useMemo inside
const metallicTextStyle = {
  background: 'linear-gradient(to bottom, #FBF5B7 0%, #BF953F 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  filter: 'drop-shadow(0px 0px 5px rgba(255, 215, 0, 0.5))'
};

function App() {
  const [stage, setStage] = useState<WishStage>('idle');
  const [wishInput, setWishInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Game States
  const [gameMode, setGameMode] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const submitWish = async () => {
    if (!wishInput.trim()) return;
    
    setStage('loading');
    setLoadingProgress(0);

    // Simulate a loading process while waiting for API
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        // Slow down as we get closer to 90%
        if (prev >= 90) return prev;
        const increment = Math.random() * 5; 
        return Math.min(90, prev + increment);
      });
    }, 200);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Updated prompt for a Humorous, Witty Wise Man persona (No stats, no science)
      const prompt = `
        You are the "AZ Concept" AI, a humorous and witty wise man (think a mix of a sassy ancient philosopher, a magical grandfather, and Santa Claus).
        The user wishes for: "${wishInput}".

        Guidelines:
        1. Tone: Mystical and warm, but laugh-out-loud funny or cheeky. 
        2. Content: Give a "wise" observation or prediction about this wish. 
        3. Constraint: Do NOT use statistics, numbers, math, or scientific jargon.
        4. Style: Use playful metaphors.
        5. Length: Keep it short and punchy (max 2 sentences).
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // API finished, complete the bar
      clearInterval(progressInterval);
      setLoadingProgress(100);

      // Short delay to allow user to see 100% completion
      setTimeout(() => {
        setAiResponse(response.text || "The cosmos has heard you, and it's currently chuckling in agreement.");
        setStage('result');
      }, 600);
      
    } catch (error) {
      clearInterval(progressInterval);
      console.error(error);
      setAiResponse("The ancient scrolls are blurry today. Perhaps the universe is on a coffee break. Ask again.");
      setStage('result');
    }
  };

  const reset = () => {
    setStage('idle');
    setWishInput('');
    setAiResponse('');
    setLoadingProgress(0);
  };

  const startGame = () => {
    setGameMode(true);
    setGameScore(0);
    setGameFinished(false);
  };

  const exitGame = () => {
    setGameMode(false);
    setGameFinished(false);
  };

  const handleGameCollect = (count: number) => {
    setGameScore(count);
  };

  const handleGameFinish = () => {
    setGameFinished(true);
  };

  const isWishMode = stage !== 'idle';

  return (
    <div className="w-full h-screen bg-[#020202] text-white relative overflow-hidden font-sans selection:bg-yellow-500/30">
      
      {/* 3D Scene Layer */}
      <Suspense fallback={null}>
        <Scene 
            wishMode={isWishMode} 
            gameMode={gameMode} 
            onGameCollect={handleGameCollect} 
            onGameFinish={handleGameFinish} 
        />
      </Suspense>
      
      {/* Initial Asset Loader */}
      <Loader 
        containerStyles={{ backgroundColor: '#020202' }}
        innerStyles={{ width: '200px', backgroundColor: '#333' }}
        barStyles={{ backgroundColor: '#FFD700', height: '2px' }}
        dataStyles={{ color: '#FFD700', fontSize: '0.8rem', fontFamily: 'Bodoni Moda, serif', letterSpacing: '0.2em' }}
        dataInterpolation={(p) => `LOADING ${p.toFixed(0)}%`}
      />

      {/* Game Mode HUD */}
      {gameMode && (
         <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-6 md:p-10">
            {/* Game Header */}
            <div className="w-full flex flex-col items-center animate-slide-down pt-8 md:pt-4 gap-4">
                <div className="bg-black/40 backdrop-blur-md border border-white/20 px-8 py-3 rounded-full flex items-center gap-6 shadow-lg shadow-yellow-500/10">
                    <span className="font-['Bodoni_Moda'] text-yellow-100 uppercase tracking-widest text-sm md:text-base">Fragments Found</span>
                    <span className="font-mono text-2xl text-yellow-400 font-bold drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">{gameScore} / 5</span>
                </div>
                
                {/* Game Instruction One-Liner */}
                <p className="font-sans text-white/60 text-[10px] md:text-xs uppercase tracking-widest drop-shadow-md bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5">
                    Rotate 360° to find hidden crystals in the void
                </p>
            </div>

            {/* Victory Modal within Game */}
            {gameFinished && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/80 backdrop-blur-sm animate-fade-in z-50">
                  <div className="relative bg-[#050505] p-2 max-w-lg mx-4"> 
                      <div className="absolute inset-0 border border-yellow-500/30"></div>
                      <div className="relative border border-yellow-500/10 px-8 py-12 md:px-12 md:py-16 text-center shadow-[0_0_50px_rgba(255,215,0,0.1)]">
                          
                          <h2 className="font-['Bodoni_Moda'] text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 mb-6 drop-shadow-sm italic leading-tight">
                              Fortune<br/>Acquired
                          </h2>
                          
                          <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-auto mb-8"></div>

                          <p className="font-['Bodoni_Moda'] text-yellow-100/90 text-lg tracking-wide mb-10 leading-relaxed font-light">
                              The stars have aligned in your favor. Your destiny is now charged with cosmic abundance.
                          </p>
                          
                          <button 
                            onClick={exitGame}
                            className="group relative px-10 py-4 overflow-hidden transition-all"
                          >
                             <div className="absolute inset-0 border border-yellow-500/30 group-hover:border-yellow-500/60 transition-colors"></div>
                             <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                             <span className="relative font-['Bodoni_Moda'] text-yellow-500 uppercase tracking-[0.25em] text-xs font-semibold group-hover:text-yellow-200 transition-colors">
                               Return to Orbit
                             </span>
                          </button>
                      </div>
                  </div>
               </div>
            )}

            {/* Exit Button (Bottom) */}
            {!gameFinished && (
                <div className="w-full flex justify-center animate-slide-up pointer-events-auto pb-10 md:pb-12">
                    <button 
                        onClick={exitGame}
                        className="text-white/80 hover:text-white font-mono text-lg md:text-xl uppercase tracking-[0.2em] transition-all border border-white/10 hover:border-red-400/50 hover:text-red-100 bg-black/60 hover:bg-red-900/20 px-12 py-6 backdrop-blur-md shadow-lg"
                    >
                        [ Abort Mission ]
                    </button>
                </div>
            )}
         </div>
      )}

      {/* Standard Poster Frame & HUD Layer (Hidden when Game is Active) */}
      {!gameMode && (
      <div className={`absolute inset-4 md:inset-8 border border-white/10 pointer-events-none z-10 flex flex-col justify-between transition-opacity duration-700 ${isWishMode ? 'opacity-20' : 'opacity-100'}`}>
        
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-yellow-500/50"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-yellow-500/50"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-yellow-500/50"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-yellow-500/50"></div>

        {/* --- Header --- */}
        <header className="p-4 md:p-10 pointer-events-auto flex justify-between items-start">
          <div className="relative group cursor-default">
            <h3 className="font-['Bodoni_Moda'] text-[9px] md:text-xs text-yellow-500/80 tracking-[0.4em] uppercase mb-2 md:mb-3">
              The 2025 Collection
            </h3>
            
            {/* Metallic Title - Further reduced size on mobile to avoid overlap */}
            <h1 
              className="font-['Bodoni_Moda'] text-3xl md:text-7xl font-bold leading-none tracking-tight"
              style={metallicTextStyle}
            >
              AZ <span className="italic font-light text-yellow-100/90" style={{ WebkitTextFillColor: 'initial', background: 'none' }}>Concept</span>
            </h1>
            
            <div className="w-full h-px bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0 my-4 md:my-6"></div>
            
            <h2 className="font-sans text-[9px] md:text-xs text-white/50 tracking-[0.3em] uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-yellow-500/50 rounded-full animate-pulse"></span>
              Geometric Christmas Tree
            </h2>
          </div>
        </header>

        {/* --- Sci-Fi Data HUD (Left Side) - Hidden on Mobile --- */}
        <div className="absolute top-1/2 left-6 md:left-10 -translate-y-1/2 hidden md:flex flex-col gap-6 pointer-events-none opacity-60">
           <div className="flex flex-col">
              <span className="font-mono text-[9px] text-yellow-500/70 tracking-widest mb-1 border-b border-white/10 pb-1 w-max">
                GEO.ENTITIES
              </span>
              <span className="font-mono text-xl text-white tracking-tighter">
                750<span className="text-xs align-top opacity-50">Units</span>
              </span>
           </div>
           
           <div className="flex flex-col">
              <span className="font-mono text-[9px] text-yellow-500/70 tracking-widest mb-1 border-b border-white/10 pb-1 w-max">
                STARDUST.PARTICLES
              </span>
              <span className="font-mono text-xl text-white tracking-tighter">
                3,000<span className="text-xs align-top opacity-50">Pts</span>
              </span>
           </div>

           <div className="flex flex-col">
              <span className="font-mono text-[9px] text-yellow-500/70 tracking-widest mb-1 border-b border-white/10 pb-1 w-max">
                LUMINOUS.FLUX
              </span>
              <span className="font-mono text-xl text-white tracking-tighter">
                8,500<span className="text-xs align-top opacity-50">Lm</span>
              </span>
           </div>
           
           <div className="w-px h-16 bg-gradient-to-b from-yellow-500/0 via-yellow-500/30 to-yellow-500/0 ml-1"></div>
        </div>

        {/* --- Footer --- */}
        <footer className="p-4 md:p-10 flex flex-col md:flex-row justify-end md:justify-between items-center md:items-end pointer-events-auto gap-4 md:gap-0 w-full">
           <div className="text-white/30 text-[9px] font-mono tracking-widest uppercase hidden md:block">
             <p>System Status: Online</p>
           </div>
           
           {/* Action Buttons Container */}
           <div className="flex gap-4 items-center justify-center w-full md:w-auto">
             
             {/* 1. PLAY A GAME BUTTON */}
             {stage === 'idle' && (
               <PremiumButton 
                 onClick={startGame} 
                 label="Play A Game"
                 icon="❖"
               />
             )}

             {/* 2. MAKE A WISH BUTTON */}
             {stage === 'idle' && (
               <PremiumButton 
                 onClick={() => setStage('input')} 
                 label="Make a Wish" 
                 icon="✦"
               />
             )}
           </div>
        </footer>
      </div>
      )}

      {/* Interaction Modal Overlay (Wish Mode) */}
      {stage !== 'idle' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-1000 p-4">
          <div className="w-full max-w-xl p-6 md:p-8 text-center relative animate-fade-in py-16 bg-black/40 md:bg-transparent rounded-2xl md:rounded-none border border-white/5 md:border-none">
            
            <button 
              onClick={reset}
              className="absolute top-2 right-2 md:top-4 md:right-4 p-4 text-white/50 hover:text-white transition-colors"
            >
              <span className="font-['Bodoni_Moda'] text-xl">✕</span>
            </button>

            {stage === 'input' && (
              <div className="space-y-6 md:space-y-8 animate-slide-up">
                <h3 className="font-['Bodoni_Moda'] text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 italic drop-shadow-lg pb-2">
                  Whisper to the Cosmos
                </h3>
                <div className="relative max-w-sm mx-auto">
                  <input
                    type="text"
                    value={wishInput}
                    onChange={(e) => setWishInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitWish()}
                    placeholder="Your wish..."
                    className="w-full bg-transparent border-b border-white/30 py-3 text-center font-['Bodoni_Moda'] text-xl md:text-2xl text-white placeholder-white/20 focus:outline-none focus:border-yellow-400 transition-colors drop-shadow-md"
                    autoFocus
                  />
                </div>
                <button
                  onClick={submitWish}
                  disabled={!wishInput.trim()}
                  className="mt-8 px-8 md:px-10 py-3 md:py-4 bg-white/5 hover:bg-white/10 text-yellow-100 font-['Bodoni_Moda'] tracking-widest uppercase text-xs transition-all border border-white/10 hover:border-yellow-500/50 backdrop-blur-md"
                >
                  Send to the Universe
                </button>
              </div>
            )}

            {stage === 'loading' && (
              <div className="space-y-6 w-full max-w-md mx-auto">
                 {/* Updated Loading Text */}
                 <div className="font-['Bodoni_Moda'] text-2xl md:text-3xl text-yellow-100 animate-pulse drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                    Merry Christmas, AZ~
                 </div>
                 
                 {/* Progress Bar Container */}
                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
                    {/* Filling Bar */}
                    <div 
                        className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 transition-all duration-300 ease-out shadow-[0_0_10px_#FFD700]"
                        style={{ width: `${loadingProgress}%` }}
                    ></div>
                 </div>
                 
                 {/* Loading subtext */}
                 <div className="flex justify-between font-mono text-[9px] text-yellow-500/70 tracking-widest uppercase">
                    <span>Consulting the Ancients...</span>
                    <span>{loadingProgress.toFixed(0)}%</span>
                 </div>
              </div>
            )}

            {stage === 'result' && (
              <div className="space-y-8 md:space-y-10 animate-fade-in">
                <div className="mb-8">
                  <div className="w-px h-12 bg-yellow-500/50 mx-auto mb-6"></div>
                  <p className="font-sans text-[10px] text-yellow-400/80 uppercase tracking-[0.3em] mb-6">The Universe Whispers</p>
                  <p className="font-['Bodoni_Moda'] text-lg md:text-3xl text-white leading-relaxed px-2 md:px-4 drop-shadow-xl italic">
                    "{aiResponse}"
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="px-8 md:px-10 py-3 border border-white/20 hover:bg-white/5 text-yellow-100 font-['Bodoni_Moda'] tracking-widest uppercase text-xs transition-all backdrop-blur-md"
                >
                  Trust the Universe
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
