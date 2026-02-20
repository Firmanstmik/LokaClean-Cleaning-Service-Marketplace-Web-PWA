import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Timer, Sparkles, Play, RotateCcw, Zap, TrendingUp, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CleaningGameProps {
  onClose: () => void;
}

interface Dirt {
  id: number;
  x: number;
  y: number;
  size: number;
  type: 'mud' | 'dust' | 'stain';
  score: number;
}

const STORAGE_KEY_LAST_SCORE = 'cleaning_game_last_score';
const STORAGE_KEY_HIGH_SCORE = 'cleaning_game_high_score';
const STORAGE_KEY_LEVEL = 'cleaning_game_level';

export function CleaningGame({ onClose }: CleaningGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(300);
  const [energy, setEnergy] = useState(0);
  const [dirts, setDirts] = useState<Dirt[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [activeTool, setActiveTool] = useState<'hand' | 'spray' | 'vacuum' | 'laser'>('hand');
  
  // Persistent Stats
  const [lastScore, setLastScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(score);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const savedLast = localStorage.getItem(STORAGE_KEY_LAST_SCORE);
    const savedHigh = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
    const savedLevel = localStorage.getItem(STORAGE_KEY_LEVEL);
    
    if (savedLast) setLastScore(parseInt(savedLast));
    if (savedHigh) setHighScore(parseInt(savedHigh));
    if (savedLevel) setLevel(parseInt(savedLevel));
  }, []);

  // Level config
  useEffect(() => {
    // Target score increases with level (Level 1: 200, Level 2: 350, etc.)
    setTargetScore(200 + (level - 1) * 150);
  }, [level]);

  // Tool definitions based on level
  useEffect(() => {
    if (level >= 20) setActiveTool('laser');
    else if (level >= 10) setActiveTool('vacuum');
    else if (level >= 5) setActiveTool('spray');
    else setActiveTool('hand');
  }, [level]);

  const getToolConfig = () => {
    switch(activeTool) {
      case 'laser': return { radius: 100, color: '#ef4444', name: 'Laser Zapper', icon: Zap };
      case 'vacuum': return { radius: 80, color: '#6366f1', name: 'Super Vacuum', icon: TrendingUp };
      case 'spray': return { radius: 60, color: '#0ea5e9', name: 'Spray Cleaner', icon: Sparkles };
      default: return { radius: 40, color: '#cbd5e1', name: 'Gloves', icon: Play };
    }
  };

  const spawnDirt = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const padding = 40;
    
    const size = Math.random() * 40 + 30; // 30px to 70px
    const isBig = size > 50;
    const score = isBig ? 25 : 15; // Big = 25pts, Small = 15pts

    const newDirt: Dirt = {
      id: Math.random(),
      x: Math.random() * (width - padding * 2) + padding,
      y: Math.random() * (height - padding * 2) + padding,
      size: size,
      type: Math.random() > 0.6 ? 'mud' : Math.random() > 0.3 ? 'stain' : 'dust',
      score: score
    };

    setDirts(prev => [...prev, newDirt]);
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    // Don't reset level here, use current state or saved state
    setEnergy(0);
    setTimeLeft(30);
    setGameOver(false);
    setLevelComplete(false);
    setDirts([]);
    
    // Initial spawn
    for (let i = 0; i < 8; i++) spawnDirt();

    // Timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
      
      // Spawn logic based on level - INCREASED SPAWN RATE
      // Level 1: 50% chance per sec
      // Level 5: 100% chance
      // Level 10: Multiple spawns guaranteed
      const spawnChance = 0.5 + (level * 0.1); 
      if (Math.random() < spawnChance) {
        spawnDirt();
        // Higher levels spawn multiple
        if (level > 2 && Math.random() > 0.5) spawnDirt();
        if (level > 5 && Math.random() > 0.4) spawnDirt();
        if (level > 8) spawnDirt(); // Always spawn extra at level 9+
      }
      
    }, 1000);
  };

  const handleLevelWin = (finalScore?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLevelComplete(true);
    setIsPlaying(false);
    
    // Use passed score or current ref value to avoid stale state
    const currentScore = finalScore ?? scoreRef.current;

    // Save progress
    const nextLevel = level + 1;
    localStorage.setItem(STORAGE_KEY_LEVEL, nextLevel.toString());
    
    // Save scores
    setLastScore(currentScore);
    localStorage.setItem(STORAGE_KEY_LAST_SCORE, currentScore.toString());

    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem(STORAGE_KEY_HIGH_SCORE, currentScore.toString());
    }

    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#ffffff', '#86efac'] // Green theme
    });
  };

  const startNextLevel = () => {
    // Explicitly update and save level to ensure persistence
    const nextLevel = level + 1;
    setLevel(nextLevel);
    localStorage.setItem(STORAGE_KEY_LEVEL, nextLevel.toString());
    
    // Also save current high score as safety
    localStorage.setItem(STORAGE_KEY_LAST_SCORE, score.toString());
    
    setLevelComplete(false);
    // Note: The UI will show "Start Level X" button.
  };

  const endGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    setIsPlaying(false);
    
    // Use ref to get latest score from closure
    const currentScore = scoreRef.current;

    // Save scores
    setLastScore(currentScore);
    localStorage.setItem(STORAGE_KEY_LAST_SCORE, currentScore.toString());
    
    if (currentScore > highScore) {
      setHighScore(currentScore);
      localStorage.setItem(STORAGE_KEY_HIGH_SCORE, currentScore.toString());
      // High Score Confetti
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#ffffff'] // Gold theme
      });
    } else {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f87171'] 
      });
    }
  };

  const activatePowerUp = () => {
    if (energy < 100) return;
    
    // "Super Vacuum" effect
    // Sum up scores of all dirt on screen
    const totalPoints = dirts.reduce((acc, d) => acc + d.score, 0);
    
    // Check Win Condition immediately
    const newScore = score + totalPoints;
    if (newScore >= targetScore) {
      handleLevelWin(newScore);
    }

    setScore(prev => prev + totalPoints);
    setDirts([]);
    setEnergy(0);
    
    // Visual feedback
    confetti({
      particleCount: 50,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#6366f1', '#8b5cf6', '#d946ef'] // Purple/Indigo "Magic" colors
    });
    
    // Spawn new batch immediately
    setTimeout(() => {
      for (let i = 0; i < 3 + level; i++) spawnDirt();
    }, 500);
  };

  // Handle click on container (Area of Effect based on tool)
  const handleContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const tool = getToolConfig();
    const hitDirts = dirts.filter(d => {
      const dx = d.x - x;
      const dy = d.y - y;
      return Math.sqrt(dx * dx + dy * dy) < (d.size/2 + tool.radius);
    });

    if (hitDirts.length > 0) {
      // Clean hit dirts
      hitDirts.forEach(d => {
        // Visual effect at dirt position
        const globalX = rect.left + d.x;
        const globalY = rect.top + d.y;
        
        confetti({
          particleCount: 10,
          spread: 30,
          startVelocity: 15,
          origin: {
            x: globalX / window.innerWidth,
            y: globalY / window.innerHeight
          },
          colors: ['#e2e8f0', '#f1f5f9'] 
        });
      });

      setDirts(prev => prev.filter(d => !hitDirts.find(hd => hd.id === d.id)));
      
      // Score & Level Logic - DYNAMIC POINTS
      const pointsGained = hitDirts.reduce((acc, d) => acc + d.score, 0);

      setScore(prev => {
        const newScore = prev + pointsGained;
        return newScore;
      });

      // Check Win Condition
      const newScore = score + pointsGained;
      if (newScore >= targetScore) {
        handleLevelWin(newScore);
      }

      setEnergy(prev => Math.min(prev + (hitDirts.length * 5), 100));
    }
  };


  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 touch-none overscroll-none h-screen w-screen top-0 left-0">
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] border-[6px] border-slate-900/10 ring-1 ring-white/20">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shadow-lg z-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-teal-500/20 p-2 rounded-xl backdrop-blur-md border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
               <Sparkles className="h-5 w-5 text-teal-300 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-white leading-none">Clean Master</h1>
              <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">Premium Edition</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors relative z-10 active:scale-95 group">
            <X className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Game Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-slate-50 overflow-hidden touch-none select-none active:cursor-grabbing"
          onMouseDown={handleContainerClick}
          onTouchStart={handleContainerClick}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
               }}>
          </div>

          {!isPlaying && !gameOver && !levelComplete && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20">
              <div className="w-full max-w-[280px] bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
                 
                 <div className="w-24 h-24 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner border border-white">
                   <Sparkles className="h-12 w-12 text-teal-600 drop-shadow-sm" />
                 </div>
                 
                 <h2 className="text-2xl font-black text-slate-800 mb-1 tracking-tight">Level {level}</h2>
                 <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-wide">Target: {targetScore} Poin</p>

                 {/* Stats */}
                 <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Terakhir</div>
                      <div className="text-xl font-black text-slate-700">{lastScore}</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 relative overflow-hidden">
                      <div className="absolute -right-2 -top-2 text-amber-100">
                        <Trophy className="h-8 w-8" />
                      </div>
                      <div className="text-[10px] text-amber-600 font-bold uppercase mb-1 relative z-10">Rekor</div>
                      <div className="text-xl font-black text-amber-600 relative z-10">{highScore}</div>
                    </div>
                 </div>

                 <button 
                   onClick={startGame}
                   className="w-full py-4 bg-slate-900 text-white font-bold text-base rounded-xl shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 group overflow-hidden relative"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   <span className="relative z-10 flex items-center gap-2">
                     <Play className="h-4 w-4 fill-current" />
                     Mulai Level {level}
                   </span>
                 </button>
              </div>
            </div>
          )}

          {levelComplete && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 bg-white/90 backdrop-blur-xl">
              <motion.div
                initial={{ scale: 0, rotate: 10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-green-400/20 blur-2xl rounded-full animate-pulse"></div>
                <Crown className="h-28 w-28 text-yellow-400 drop-shadow-2xl relative z-10" />
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap border-2 border-white z-20"
                >
                  Level Completed!
                </motion.div>
              </motion.div>
              
              <div className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Skor Anda</div>
              <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-600 to-teal-800 mb-8 drop-shadow-sm tracking-tighter">{score}</div>
              
              <div className="w-full space-y-3 max-w-[280px]">
                <button 
                  onClick={startNextLevel}
                  className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <TrendingUp className="h-5 w-5" />
                  Lanjut Level {level + 1}
                </button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 bg-white/90 backdrop-blur-xl">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-red-400/20 blur-2xl rounded-full animate-pulse"></div>
                <X className="h-28 w-28 text-rose-500 drop-shadow-2xl relative z-10" />
              </motion.div>
              
              <div className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Gagal!</div>
              <p className="text-slate-600 font-bold mb-6">Target: {targetScore} Poin</p>
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 mb-8 drop-shadow-sm tracking-tighter">{score}</div>
              
              <div className="w-full space-y-3 max-w-[280px]">
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <RotateCcw className="h-5 w-5" />
                  Coba Lagi (Level {level})
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-white text-slate-500 font-bold text-lg rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-colors active:scale-95"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}

          {/* HUD */}
          {isPlaying && (
            <>
              {/* Top Stats Bar */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 pointer-events-none">
                <div className="flex flex-col gap-2">
                   <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 text-slate-800 font-black min-w-[100px]">
                     <Sparkles className="h-4 w-4 text-teal-500" />
                     <span className="text-lg">{score}</span>
                   </div>
                   <div className="flex gap-2">
                     <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                       <TrendingUp className="h-3 w-3 text-emerald-500" />
                       <span className="text-xs font-bold text-slate-600">Lv.{level}</span>
                     </div>
                     {/* Active Tool Indicator */}
                     <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2" style={{ color: getToolConfig().color }}>
                        {(() => {
                          const Icon = getToolConfig().icon;
                          return <Icon className="h-3 w-3" />;
                        })()}
                        <span className="text-xs font-bold uppercase">{getToolConfig().name}</span>
                     </div>
                   </div>
                </div>

                <div className={`px-4 py-2 rounded-2xl shadow-sm border-2 flex items-center gap-2 font-black text-lg transition-all ${timeLeft <= 5 ? 'bg-rose-500 border-rose-600 text-white animate-pulse scale-110' : 'bg-white/90 border-slate-100 text-slate-700'}`}>
                  <Timer className={`h-5 w-5 ${timeLeft <= 5 ? 'text-white' : 'text-slate-400'}`} />
                  <span>{timeLeft}s</span>
                </div>
              </div>

              {/* Power Up FAB */}
              <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
                 <div className="relative">
                    <svg className="w-20 h-20 -rotate-90 transform">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * energy) / 100} className={`transition-all duration-300 ${energy >= 100 ? 'text-indigo-500' : 'text-teal-500'}`} />
                    </svg>
                    <button 
                      onClick={(e) => { e.stopPropagation(); activatePowerUp(); }}
                      disabled={energy < 100}
                      className={`absolute inset-2 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${energy >= 100 ? 'bg-indigo-600 text-white scale-100 cursor-pointer animate-bounce' : 'bg-slate-100 text-slate-300 scale-90 cursor-not-allowed'}`}
                    >
                      <Zap className={`h-8 w-8 ${energy >= 100 ? 'fill-current' : ''}`} />
                    </button>
                 </div>
              </div>
            </>
          )}

          {/* Dirts */}
          <AnimatePresence>
            {dirts.map(dirt => (
              <motion.div
                key={dirt.id}
                initial={{ scale: 0, opacity: 0, rotate: Math.random() * 360 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.5, opacity: 0, filter: 'brightness(2)' }}
                style={{
                  position: 'absolute',
                  left: dirt.x,
                  top: dirt.y,
                  width: dirt.size,
                  height: dirt.size,
                  marginLeft: -dirt.size / 2,
                  marginTop: -dirt.size / 2,
                }}
                className="pointer-events-none"
              >
                {/* Visual based on type */}
                {dirt.type === 'mud' && (
                  <div className="w-full h-full relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-amber-800/90 drop-shadow-md">
                      <path fill="currentColor" d="M50 20 Q70 5 80 30 T90 60 Q80 90 50 85 T10 60 Q20 30 50 20 Z" />
                    </svg>
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-600 rounded-full opacity-50"></div>
                  </div>
                )}
                {dirt.type === 'dust' && (
                  <div className="w-full h-full relative">
                     <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400/80 drop-shadow-sm">
                       <circle cx="50" cy="50" r="40" fill="currentColor" filter="url(#blur)" />
                       <defs>
                         <filter id="blur">
                           <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                         </filter>
                       </defs>
                     </svg>
                     <div className="absolute inset-0 bg-slate-200/30 rounded-full blur-xl animate-pulse"></div>
                  </div>
                )}
                {dirt.type === 'stain' && (
                  <div className="w-full h-full relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-rose-400/80 drop-shadow-md">
                       <path fill="currentColor" d="M40 30 Q60 10 70 40 T60 70 Q40 80 30 60 T40 30 Z" />
                    </svg>
                    <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  , document.body);
}
