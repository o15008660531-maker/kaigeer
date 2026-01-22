import React, { useState, useEffect } from 'react';
import { Activity, BarChart2, MessageSquareText, Home, Trophy, Calendar, Flame, Zap, Timer, Sun, Moon, Sunrise, Check, Layers, ArrowDownUp } from 'lucide-react';
import ExerciseSession from './components/ExerciseSession';
import HistoryChart from './components/HistoryChart';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { AppView, DifficultyLevel, WorkoutLog } from './types';

// Constants: 3 Master Level Daily Routines
const LEVELS: DifficultyLevel[] = [
  { 
    id: 'titan_morning', 
    name: '晨间 · 大师级激活', 
    description: '高容量神经募集训练。通过50次极速点射与高强度阶梯收缩，让肌肉在清晨达到兴奋极值。', 
    color: 'bg-orange-500',
    phases: [
      { name: '深度预热', type: 'standard', contractDuration: 3, relaxDuration: 3, reps: 15 }, // 90s
      { name: '快肌风暴', type: 'explosive', contractDuration: 0.5, relaxDuration: 0.5, reps: 50 }, // 50s High freq
      { name: '三步强控', type: 'steps_3', contractDuration: 3, relaxDuration: 5, reps: 10 }, // 140s (9s contract + 5s relax)
      { name: '变速冲刺', type: 'explosive', contractDuration: 1, relaxDuration: 1, reps: 40 }, // 80s
      { name: '耐力收尾', type: 'standard', contractDuration: 5, relaxDuration: 5, reps: 10 } // 100s
    ]
  },
  { 
    id: 'titan_noon', 
    name: '午间 · 力量巅峰', 
    description: '地狱级金字塔耐力组。挑战30秒极限长收与五步慢速精控，彻底榨干肌肉糖原。', 
    color: 'bg-red-600',
    phases: [
      { name: '塔基建立 (5秒)', type: 'endurance', contractDuration: 5, relaxDuration: 5, reps: 10 }, // 100s
      { name: '强度爬升 (15秒)', type: 'endurance', contractDuration: 15, relaxDuration: 5, reps: 10 }, // 200s
      { name: '塔尖极限 (30秒)', type: 'endurance', contractDuration: 30, relaxDuration: 15, reps: 5 }, // 225s - Hardcore
      { name: '控制回落 (15秒)', type: 'endurance', contractDuration: 15, relaxDuration: 10, reps: 8 }, // 200s
      { name: '五步精雕', type: 'steps_5', contractDuration: 2, relaxDuration: 5, reps: 10 }, // 150s (10s contract)
      { name: '排酸泵感', type: 'explosive', contractDuration: 1, relaxDuration: 1, reps: 40 } // 80s
    ]
  },
  { 
    id: 'titan_evening', 
    name: '晚间 · 深度重塑', 
    description: '专注于深层肌纤维的静态耐力与呼吸冥想。无反向动作，纯粹的控制力训练。', 
    color: 'bg-indigo-600',
    phases: [
      { name: '静态负重 (45秒)', type: 'endurance', contractDuration: 45, relaxDuration: 20, reps: 4 }, // 260s - Expert only
      { name: '深度放松', type: 'standard', contractDuration: 0.1, relaxDuration: 15, reps: 10 }, // Deep relax focus (Contract is miniscule just to trigger relax)
      { name: '三步慢离心', type: 'steps_3', contractDuration: 4, relaxDuration: 8, reps: 8 }, // 160s (12s contract)
      { name: '调息放松', type: 'standard', contractDuration: 2, relaxDuration: 10, reps: 10 }, // 120s
      { name: '呼吸冥想', type: 'standard', contractDuration: 4, relaxDuration: 6, reps: 10 } // 100s
    ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [selectedLevel, setSelectedLevel] = useState<DifficultyLevel>(LEVELS[0]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  // Load logs from local storage
  useEffect(() => {
    const savedLogs = localStorage.getItem('kegel_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse logs");
      }
    }
  }, []);

  const saveLog = (log: WorkoutLog) => {
    const newLogs = [...logs, log];
    setLogs(newLogs);
    localStorage.setItem('kegel_logs', JSON.stringify(newLogs));
  };

  const handleWorkoutComplete = (duration: number) => {
    saveLog({
      date: new Date().toISOString(),
      difficultyId: selectedLevel.id,
      durationSeconds: duration,
      completed: true
    });
    setCurrentView(AppView.DASHBOARD);
  };

  const getTotalMinutes = () => {
    return Math.round(logs.reduce((acc, log) => acc + log.durationSeconds, 0) / 60);
  };

  const getTodayMinutes = () => {
    const today = new Date().toISOString().split('T')[0];
    return Math.round(logs.filter(l => l.date.startsWith(today)).reduce((acc, log) => acc + log.durationSeconds, 0) / 60);
  };

  const calculateTotalDuration = (level: DifficultyLevel) => {
    return level.phases.reduce((acc, phase) => {
        let contractTime = phase.contractDuration;
        if (phase.type === 'steps_3') contractTime *= 3;
        if (phase.type === 'steps_5') contractTime *= 5;
        return acc + (phase.reps * (contractTime + phase.relaxDuration));
    }, 0);
  };

  const isLevelCompletedToday = (levelId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return logs.some(l => l.date.startsWith(today) && l.difficultyId === levelId && l.completed);
  };

  const getDayProgress = () => {
    const completedCount = LEVELS.filter(l => isLevelCompletedToday(l.id)).length;
    return { count: completedCount, total: LEVELS.length };
  };

  const getRecommendedLevelId = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'titan_morning';
    if (hour < 17) return 'titan_noon';
    return 'titan_evening';
  };

  const getLevelIcon = (id: string) => {
    switch(id) {
        case 'titan_morning': return <Sunrise size={28} />;
        case 'titan_noon': return <Sun size={28} />;
        case 'titan_evening': return <Moon size={28} />;
        default: return <Activity size={28} />;
    }
  };

  const getPhaseIcon = (type: string) => {
      switch(type) {
          case 'explosive': return <Zap size={10} />;
          case 'endurance': return <Timer size={10} />;
          case 'steps_3': return <Layers size={10} />;
          case 'steps_5': return <Layers size={10} />;
          default: return <Activity size={10} />;
      }
  };

  // Render Logic
  const renderContent = () => {
    switch (currentView) {
      case AppView.WORKOUT:
        return (
          <ExerciseSession 
            level={selectedLevel} 
            onComplete={handleWorkoutComplete}
            onCancel={() => setCurrentView(AppView.DASHBOARD)}
          />
        );
      
      case AppView.STATS:
        return (
           <div className="h-full p-6 space-y-6 overflow-y-auto pb-24">
             <h2 className="text-2xl font-bold text-slate-800">大师级统计</h2>
             <HistoryChart logs={logs} />
             
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Trophy size={18} className="text-yellow-500" />
                        <span className="text-sm">累计时长</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{getTotalMinutes()} <span className="text-sm font-normal text-slate-400">分钟</span></p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Calendar size={18} className="text-indigo-500" />
                        <span className="text-sm">今日训练</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{getTodayMinutes()} <span className="text-sm font-normal text-slate-400">分钟</span></p>
                </div>
             </div>

             <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                 <h3 className="font-medium text-slate-800 mb-4">今日打卡</h3>
                 <div className="space-y-3">
                    {LEVELS.map(level => {
                        const isDone = isLevelCompletedToday(level.id);
                        return (
                            <div key={level.id} className={`flex justify-between items-center p-3 rounded-xl border ${isDone ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDone ? 'bg-white text-green-600' : 'bg-white text-slate-400'}`}>
                                        {getLevelIcon(level.id)}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isDone ? 'text-green-800' : 'text-slate-600'}`}>{level.name.split(' ')[0]}</p>
                                        <p className="text-xs text-slate-400">{isDone ? '已完成' : '未完成'}</p>
                                    </div>
                                </div>
                                {isDone && <Check size={20} className="text-green-500" />}
                            </div>
                        );
                    })}
                 </div>
             </div>
           </div>
        );

      case AppView.DASHBOARD:
      default:
        const { count, total } = getDayProgress();
        const recommendedId = getRecommendedLevelId();

        return (
          <div className="h-full p-6 space-y-8 overflow-y-auto pb-24">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">专业分化训练</h1>
                    <p className="text-slate-500 text-sm">全方位激活、强化与修复。</p>
                </div>
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    K
                </div>
            </header>

            {/* Daily Progress Banner */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-4">
                        <p className="text-indigo-200 text-sm font-medium">今日计划</p>
                        <span className="text-2xl font-bold">{count} / {total}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                            className="bg-indigo-400 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${(count / total) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">专家建议：早中晚各一次</p>
                </div>
            </div>

            {/* Level Selector - 3 Times A Day */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">大师级课程</h3>
                <div className="space-y-4">
                    {LEVELS.map(level => {
                        const isDone = isLevelCompletedToday(level.id);
                        const isRecommended = level.id === recommendedId && !isDone;
                        const durationMins = Math.ceil(calculateTotalDuration(level) / 60);
                        
                        return (
                            <button
                                key={level.id}
                                onClick={() => {
                                    if (!isDone) {
                                        setSelectedLevel(level);
                                        setCurrentView(AppView.WORKOUT);
                                    }
                                }}
                                disabled={isDone}
                                className={`w-full relative overflow-hidden text-left transition-all duration-300
                                    ${isDone 
                                        ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-default' 
                                        : 'bg-white border-2 border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 hover:-translate-y-1'
                                    }
                                    ${isRecommended ? 'ring-2 ring-indigo-500 ring-offset-2 border-indigo-100' : ''}
                                    rounded-2xl
                                `}
                            >
                                <div className="p-6 relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${level.color} ${isDone ? 'grayscale' : ''}`}>
                                            {getLevelIcon(level.id)}
                                        </div>
                                        {isDone ? (
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                                <Check size={12} /> 已完成
                                            </span>
                                        ) : (
                                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full border border-slate-600">
                                                {durationMins} 分钟
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h4 className={`text-xl font-bold mb-1 ${isDone ? 'text-slate-500' : 'text-slate-800'}`}>
                                        {level.name}
                                    </h4>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{level.description}</p>
                                    
                                    {/* Mini Phase Indicators */}
                                    {!isDone && (
                                        <div className="flex gap-2 flex-wrap">
                                            {level.phases.map((phase, idx) => (
                                                <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100 flex items-center gap-1">
                                                    {getPhaseIcon(phase.type)} {phase.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {isRecommended && !isDone && (
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold z-20">
                                        大师推荐
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tip */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <div className="flex gap-2 items-start">
                    <MessageSquareText size={18} className="text-indigo-500 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-indigo-900 text-sm">专家知识</h4>
                        <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                            <span className="font-bold">盲练提示：</span> 
                            已开启全语音导航。请跟随语音指令进行训练，无需时刻盯着屏幕，专注于肌肉的精细控制。
                        </p>
                    </div>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-slate-50 flex flex-col shadow-2xl overflow-hidden relative">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {currentView !== AppView.WORKOUT && (
        <nav className="h-20 bg-white border-t border-slate-100 flex justify-around items-center px-6 absolute bottom-0 w-full z-20">
          <button 
            onClick={() => setCurrentView(AppView.DASHBOARD)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.DASHBOARD ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <Home size={24} />
            <span className="text-[10px] font-medium">主页</span>
          </button>
          
          <button 
            onClick={() => setCurrentView(AppView.STATS)}
            className={`flex flex-col items-center gap-1 transition-colors ${currentView === AppView.STATS ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <BarChart2 size={24} />
            <span className="text-[10px] font-medium">统计</span>
          </button>
        </nav>
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;