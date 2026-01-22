import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, CheckCircle, Volume2, VolumeX, Coffee } from 'lucide-react';
import { DifficultyLevel, ExerciseState, ExercisePhase } from '../types';
import { audioService } from '../services/audioService';

interface ExerciseSessionProps {
  level: DifficultyLevel;
  onComplete: (duration: number) => void;
  onCancel: () => void;
}

const ExerciseSession: React.FC<ExerciseSessionProps> = ({ level, onComplete, onCancel }) => {
  const [state, setState] = useState<ExerciseState>(ExerciseState.IDLE);
  
  // Phase Management
  const [phaseIndex, setPhaseIndex] = useState(0);
  const currentPhase: ExercisePhase = level.phases[phaseIndex];

  const [currentRep, setCurrentRep] = useState(1);
  const [timer, setTimer] = useState(0); // Current countdown
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const timerRef = useRef<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Track the last announced step to avoid repeating it
  const lastAnnouncedStepRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const speak = useCallback((text: string) => {
      if (!soundEnabled) return;
      audioService.speak(text);
  }, [soundEnabled]);

  const playSound = useCallback((type: 'start' | 'contract' | 'relax' | 'finish' | 'phase_change' | 'step' | 'rest') => {
    if (!soundEnabled) return;
    if (navigator.vibrate) {
        if (type === 'contract') navigator.vibrate(200);
        else if (type === 'relax') navigator.vibrate(50);
        else if (type === 'phase_change') navigator.vibrate([100, 50, 100]);
        else if (type === 'rest') navigator.vibrate([50, 50]);
        else if (type === 'step') navigator.vibrate(50);
    }
    
    switch (type) {
      case 'start': audioService.playStart(); break;
      case 'contract': audioService.playContract(); break;
      case 'relax': audioService.playRelax(); break;
      case 'finish': audioService.playFinish(); break;
      case 'phase_change': audioService.playStart(); break;
      case 'rest': audioService.playRelax(); break;
      case 'step': audioService.playStep(); break;
    }
  }, [soundEnabled]);

  const startExercise = () => {
    setState(ExerciseState.GET_READY);
    setTimer(3);
    playSound('start');
    speak("准备开始");
  };

  const getContractTotalDuration = (phase: ExercisePhase) => {
    if (phase.type === 'steps_3') return phase.contractDuration * 3;
    if (phase.type === 'steps_5') return phase.contractDuration * 5;
    return phase.contractDuration;
  };

  // Helper to calculate step info based on current timer
  const calculateStepInfo = (phase: ExercisePhase, currentTimer: number) => {
      if (phase.type !== 'steps_3' && phase.type !== 'steps_5') return null;
      
      const totalSteps = phase.type === 'steps_3' ? 3 : 5;
      const totalDuration = phase.contractDuration * totalSteps;
      const elapsedInPhase = totalDuration - currentTimer;
      // Calculate current step (1-based), ensuring it doesn't exceed totalSteps
      // Adding a small epsilon to avoid flickering at exact boundaries
      const rawStep = Math.floor((elapsedInPhase + 0.05) / phase.contractDuration) + 1;
      const step = Math.min(totalSteps, Math.max(1, rawStep));
      
      return { step, total: totalSteps };
  };

  // Main Timer Loop
  useEffect(() => {
    if (isPaused || state === ExerciseState.IDLE || state === ExerciseState.FINISHED) {
      clearTimer();
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0.1) {
          return 0;
        }
        return prev - 0.1;
      });
      
      if (state === ExerciseState.CONTRACT || state === ExerciseState.RELAX) {
        setElapsedTime(prev => prev + 0.1);
      }
    }, 100);

    return () => clearTimer();
  }, [state, isPaused]);

  // Step Voice Announcer
  useEffect(() => {
     if (state !== ExerciseState.CONTRACT) {
         lastAnnouncedStepRef.current = 0;
         return;
     }

     const stepInfo = calculateStepInfo(currentPhase, timer);
     if (stepInfo) {
         if (stepInfo.step !== lastAnnouncedStepRef.current) {
             lastAnnouncedStepRef.current = stepInfo.step;
             playSound('step');
             if (stepInfo.step === stepInfo.total) {
                 speak(`${stepInfo.step}阶，保持住`);
             } else {
                 speak(`${stepInfo.step}阶`);
             }
         }
     }
  }, [timer, state, currentPhase, playSound, speak]);

  // State Transition Logic
  useEffect(() => {
    if (timer > 0.1) return; // Wait for timer to finish

    if (state === ExerciseState.GET_READY) {
      // Start First Phase
      setState(ExerciseState.CONTRACT);
      setTimer(getContractTotalDuration(currentPhase));
      playSound('contract');
      if (currentPhase.type === 'explosive') speak("用力");
      else if (currentPhase.type === 'endurance') speak("收缩保持");
      else if (currentPhase.type === 'standard') speak("收缩");
      // Note: Steps are handled by the separate effect above
    } 
    else if (state === ExerciseState.CONTRACT) {
      setState(ExerciseState.RELAX);
      setTimer(currentPhase.relaxDuration);
      playSound('relax');
      speak("放松");
    } 
    else if (state === ExerciseState.RELAX) {
      if (currentRep < currentPhase.reps) {
        // Next Rep
        setCurrentRep(prev => prev + 1);
        setState(ExerciseState.CONTRACT);
        setTimer(getContractTotalDuration(currentPhase));
        playSound('contract');
        
        // Voice for next rep (simplified for high frequency)
        if (currentPhase.type !== 'explosive') { // Don't speak on every fast twitch
             if (currentPhase.type === 'standard') speak("收缩");
             else if (currentPhase.type === 'endurance') speak("保持");
        }
      } else {
        // Phase Complete
        if (phaseIndex < level.phases.length - 1) {
           // Move to Phase Rest
           setState(ExerciseState.PHASE_REST);
           setTimer(5); // 5 seconds rest between phases
           playSound('rest');
           const nextPhaseName = level.phases[phaseIndex + 1].name;
           speak(`休息5秒。准备：${nextPhaseName}`);
        } else {
           // All Phases Complete
           setState(ExerciseState.FINISHED);
           playSound('finish');
           clearTimer();
        }
      }
    }
    else if (state === ExerciseState.PHASE_REST) {
        // Rest over, start next phase
        const nextIndex = phaseIndex + 1;
        const nextPhase = level.phases[nextIndex];
        
        setPhaseIndex(nextIndex);
        setCurrentRep(1);
        setState(ExerciseState.CONTRACT);
        setTimer(getContractTotalDuration(nextPhase));
        playSound('phase_change');
        
        if (nextPhase.type === 'steps_3') speak("三阶收缩，开始");
        else if (nextPhase.type === 'steps_5') speak("五阶收缩，开始");
        else speak("开始");
    }
  }, [timer, state, currentRep, phaseIndex, level, playSound, speak, currentPhase]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearTimer();
  }, []);

  // Visual Logic
  const getCircleScale = () => {
    if (state === ExerciseState.IDLE) return 1;
    if (state === ExerciseState.GET_READY) return 1;
    if (state === ExerciseState.PHASE_REST) return 1;
    
    if (state === ExerciseState.CONTRACT) {
        if (currentPhase.type === 'steps_3' || currentPhase.type === 'steps_5') {
            const info = calculateStepInfo(currentPhase, timer);
            if (info) {
                // Stepped scale: 1 -> 0.6
                // Map step 1..Max to 0.9..0.6
                const maxReduction = 0.4; // 1 - 0.6
                const reductionPerStep = maxReduction / info.total;
                const currentReduction = reductionPerStep * info.step;
                return 1 - currentReduction;
            }
        }
        // Standard smooth contraction
        const duration = getContractTotalDuration(currentPhase);
        const progress = 1 - (timer / duration);
        return Math.max(0.6, 1 - (progress * 0.4));
    }

    if (state === ExerciseState.RELAX) {
      const progress = 1 - (timer / currentPhase.relaxDuration);
      return Math.min(1, 0.6 + (progress * 0.4));
    }
    return 1;
  };

  const getStatusText = () => {
    switch (state) {
      case ExerciseState.IDLE: return "准备开始";
      case ExerciseState.GET_READY: return "准备...";
      case ExerciseState.PHASE_REST: return "休息一下";
      case ExerciseState.CONTRACT: 
        const stepInfo = calculateStepInfo(currentPhase, timer);
        if (stepInfo) return `第 ${stepInfo.step} 阶收紧`;
        if (currentPhase.type === 'explosive') return "爆发收缩!";
        if (currentPhase.type === 'endurance') return "保持收缩";
        return "收缩 (提肛)";
      case ExerciseState.RELAX: 
        return "放松";
      case ExerciseState.FINISHED: return "训练完成!";
      default: return "";
    }
  };

  const getCircleColor = () => {
    switch (state) {
      case ExerciseState.PHASE_REST: return "bg-sky-200 text-sky-700 shadow-[0_0_20px_rgba(186,230,253,0.5)]";
      case ExerciseState.CONTRACT:
        if (currentPhase.type === 'explosive') return "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]";
        if (currentPhase.type === 'steps_3') return "bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.6)]";
        if (currentPhase.type === 'steps_5') return "bg-violet-700 shadow-[0_0_30px_rgba(109,40,217,0.6)]";
        return "bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.6)]";
      case ExerciseState.RELAX: return "bg-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.4)]";
      default: return "bg-slate-300";
    }
  };

  if (state === ExerciseState.FINISHED) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-500">
        <CheckCircle className="w-32 h-32 text-green-500" />
        <h2 className="text-3xl font-bold text-slate-800">太棒了!</h2>
        <p className="text-slate-600 text-center max-w-xs">
          你完成了 {level.name}。<br/>
          大师级表现。
        </p>
        <button
          onClick={() => onComplete(elapsedTime)}
          className="px-8 py-3 bg-slate-900 text-white rounded-full font-semibold shadow-lg hover:bg-slate-800 transition-colors"
        >
          保存并返回
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-slate-50">
      {/* Header Info */}
      <div className="flex justify-between items-center p-4">
        <div className="flex flex-col">
          <span className="text-xs text-indigo-600 font-bold tracking-wider uppercase bg-indigo-50 px-2 py-1 rounded mb-1 w-fit">
            {state === ExerciseState.PHASE_REST ? '即将进入下一阶段' : currentPhase.name}
          </span>
          <span className="text-2xl font-bold text-slate-800">
            {state === ExerciseState.IDLE ? '0' : state === ExerciseState.PHASE_REST ? '-' : currentRep} <span className="text-slate-400 text-lg">/ {state === ExerciseState.PHASE_REST ? '-' : currentPhase.reps}</span>
          </span>
          {/* Phase progress dots */}
          <div className="flex gap-1 mt-2">
            {level.phases.map((_, idx) => (
                <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === phaseIndex ? 'w-6 bg-indigo-600' : idx < phaseIndex ? 'w-3 bg-indigo-200' : 'w-3 bg-slate-200'}`}></div>
            ))}
          </div>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 bg-white rounded-full shadow-sm text-slate-600">
            {soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
        </button>
      </div>

      {/* Main Visualizer */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Background Ripples - Faster animation for short durations */}
        <div className={`absolute w-64 h-64 rounded-full border border-slate-200 ${state === ExerciseState.CONTRACT ? 'scale-75' : 'scale-100'} transition-transform opacity-50`} style={{ transitionDuration: `${getContractTotalDuration(currentPhase) < 2 ? '200ms' : '2000ms'}` }}></div>
        <div className={`absolute w-80 h-80 rounded-full border border-slate-100 ${state === ExerciseState.CONTRACT ? 'scale-75' : 'scale-100'} transition-transform delay-75 opacity-30`} style={{ transitionDuration: `${getContractTotalDuration(currentPhase) < 2 ? '200ms' : '2000ms'}` }}></div>
        
        {/* Active Circle */}
        <div 
          className={`w-48 h-48 rounded-full flex items-center justify-center text-white text-5xl font-bold transition-all z-10 ${getCircleColor()}`}
          style={{ 
              transform: `scale(${getCircleScale()})`,
              transitionDuration: (state === ExerciseState.CONTRACT && (currentPhase.type === 'steps_3' || currentPhase.type === 'steps_5')) ? '300ms' : '100ms' // Snap for steps
          }}
        >
          {state !== ExerciseState.IDLE && Math.ceil(timer)}
        </div>

        <div className="mt-12 text-center h-20 px-6">
           <h2 className={`text-3xl font-bold transition-colors duration-300 ${state === ExerciseState.CONTRACT ? 'text-indigo-600' : state === ExerciseState.RELAX ? 'text-teal-600' : state === ExerciseState.PHASE_REST ? 'text-sky-600' : 'text-slate-700'}`}>
             {getStatusText()}
           </h2>
           {state === ExerciseState.IDLE ? (
             <p className="text-slate-500 mt-2">点击下方开始按钮</p>
           ) : state === ExerciseState.PHASE_REST ? (
             <p className="text-slate-400 mt-2 text-sm flex items-center justify-center gap-2">
                 <Coffee size={16} /> 下一组: {level.phases[phaseIndex + 1]?.name}
             </p>
           ) : (
             <p className="text-slate-400 mt-2 text-sm">
                 {currentPhase.type === 'steps_3' && '跟随语音：分三层逐级收紧'}
                 {currentPhase.type === 'steps_5' && '跟随语音：精细控制每一层'}
                 {currentPhase.type === 'explosive' && '用力收缩，立刻放松'}
                 {currentPhase.type === 'endurance' && '保持住，不要松懈'}
                 {currentPhase.type === 'standard' && '标准收缩'}
             </p>
           )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 pb-12 flex justify-center gap-6">
        {state === ExerciseState.IDLE ? (
          <button 
            onClick={startExercise}
            className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            <Play size={32} fill="currentColor" />
          </button>
        ) : (
          <>
             <button 
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              {isPaused ? <Play size={28} /> : <Pause size={28} />}
            </button>
            
            <button 
              onClick={onCancel}
              className="w-16 h-16 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-100 transition-colors"
            >
              <Square size={24} fill="currentColor" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExerciseSession;