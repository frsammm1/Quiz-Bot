import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Book, RefreshCw, Palette, Brain, Calculator, SpellCheck, ChevronLeft, ChevronRight, Home, Languages, ThumbsUp, BarChart, FileText, LogOut, Shield, Loader2 } from 'lucide-react';
import { Subject, QuestionData, QuizMode, Theme, HistoryItem, Language, MathsDifficulty, User } from '../types';
import { generateQuestion } from '../services/geminiService';
import { QuestionCard } from '../components/QuestionCard';

type QuizView = 'mode_selection' | 'subject_selection' | 'difficulty_selection' | 'quiz_active';

const themes: Record<Theme, Record<string, string>> = {
  slate: {
    bg: 'bg-slate-950',
    header: 'bg-slate-900',
    border: 'border-slate-800',
    text: 'text-slate-200',
    textMuted: 'text-slate-400',
    primaryBtn: 'bg-blue-600 hover:bg-blue-500',
    secondaryBtn: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
    bubbleBg: 'bg-slate-800',
    bubbleSecondaryBg: 'bg-slate-900/50',
    optionBg: 'bg-slate-700 hover:bg-slate-600',
  },
  rose: {
    bg: 'bg-rose-950',
    header: 'bg-rose-900/80',
    border: 'border-rose-800/80',
    text: 'text-rose-100',
    textMuted: 'text-rose-300/80',
    primaryBtn: 'bg-rose-600 hover:bg-rose-500',
    secondaryBtn: 'bg-rose-800 hover:bg-rose-700 text-rose-200 border-rose-700',
    bubbleBg: 'bg-rose-900/60',
    bubbleSecondaryBg: 'bg-rose-950/50',
    optionBg: 'bg-rose-800/80 hover:bg-rose-700/80',
  },
  sky: {
    bg: 'bg-sky-950',
    header: 'bg-sky-900/80',
    border: 'border-sky-800/80',
    text: 'text-sky-100',
    textMuted: 'text-sky-300/80',
    primaryBtn: 'bg-sky-600 hover:bg-sky-500',
    secondaryBtn: 'bg-sky-800 hover:bg-sky-700 text-sky-200 border-sky-700',
    bubbleBg: 'bg-sky-900/60',
    bubbleSecondaryBg: 'bg-sky-950/50',
    optionBg: 'bg-sky-800/80 hover:bg-sky-700/80',
  },
};

interface QuizScreenProps {
  logout: () => void;
  openAdminPanel: () => void;
  isAdmin: boolean;
  currentUser: User | null;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ logout, openAdminPanel, isAdmin, currentUser }) => {
  const [theme, setTheme] = useState<Theme>('slate');

  // App State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [queue, setQueue] = useState<QuestionData[]>([]); // PRE-FETCH QUEUE
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [score, setScore] = useState(0);
  
  // Navigation State
  const [view, setView] = useState<QuizView>('mode_selection');
  const [currentQuizMode, setCurrentQuizMode] = useState<QuizMode | null>(null);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentMathsDifficulty, setCurrentMathsDifficulty] = useState<MathsDifficulty | null>(null);
  const [language, setLanguage] = useState<Language>('english');

  // Refs to handle async logic safely
  const mountedRef = useRef(true);

  const themeClasses = themes[theme];
  const themeCycle: Theme[] = ['slate', 'rose', 'sky'];

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Session Security Check
  useEffect(() => {
    const checkSession = () => {
        if (!currentUser) return;
        
        const storedUsersStr = localStorage.getItem('quizApp_users');
        if (storedUsersStr) {
            const storedUsers: User[] = JSON.parse(storedUsersStr);
            const freshUserData = storedUsers.find(u => u.username === currentUser.username);
            
            if (freshUserData && freshUserData.sessionToken !== currentUser.sessionToken) {
                alert("You have been logged out because your account was accessed from another device.");
                logout();
            }
        }
    };

    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, [currentUser, logout]);
  
  const handleThemeChange = () => {
    const currentIndex = themeCycle.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeCycle.length;
    setTheme(themeCycle[nextIndex]);
  };

  const handleLanguageToggle = () => {
    setLanguage(prev => prev === 'english' ? 'hindi' : 'english');
  };
  
  // --- PREFETCHING LOGIC ---
  const prefetchQuestions = async (count: number, subject: Subject, mode: QuizMode, difficulty?: MathsDifficulty) => {
    // Fetch 'count' questions in background
    for (let i = 0; i < count; i++) {
      try {
        if (!mountedRef.current) return;
        const q = await generateQuestion(subject, mode, difficulty);
        
        if (mountedRef.current) {
          setQueue(prev => {
            // Limit queue size to avoid memory bloat
            if (prev.length > 10) return prev;
            return [...prev, q];
          });
        }
      } catch (e) {
        console.error("Background prefetch failed:", e);
      }
    }
  };

  const startQuizSession = async (subject: Subject, mode: QuizMode, difficulty?: MathsDifficulty) => {
    setHistory([]);
    setQueue([]);
    setCurrentIndex(-1);
    setScore(0);
    setIsGenerating(true);

    try {
      // Fetch FIRST question immediately (blocking)
      const firstQuestion = await generateQuestion(subject, mode, difficulty);
      
      if (mountedRef.current) {
        setHistory([{ question: firstQuestion, result: null }]);
        setCurrentIndex(0);
        setIsGenerating(false); // Unblock UI
        
        // Then fetch 4 more in background (non-blocking)
        prefetchQuestions(4, subject, mode, difficulty);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate question. Please check your API Key and network connection.");
      if (mountedRef.current) setIsGenerating(false);
    }
  };

  const handleModeSelect = (mode: QuizMode) => {
    setCurrentQuizMode(mode);
    setView('subject_selection');
  };

  const handleSubjectSelect = async (subject: Subject) => {
    setCurrentSubject(subject);
    if (subject === 'Maths') {
      setView('difficulty_selection');
    } else {
      if(currentQuizMode) {
        setView('quiz_active');
        await startQuizSession(subject, currentQuizMode);
      }
    }
  };

  const handleMathsDifficultySelect = async (difficulty: MathsDifficulty) => {
    if (!currentQuizMode || currentSubject !== 'Maths') return;
    setCurrentMathsDifficulty(difficulty);
    setView('quiz_active');
    await startQuizSession('Maths', currentQuizMode, difficulty);
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (currentIndex < 0 || !history[currentIndex] || history[currentIndex].result) return;
    
    const currentItem = history[currentIndex];
    const isCorrect = optionIndex === currentItem.question.correctIndex;
    
    if (isCorrect) setScore(s => s + 1);

    const resultData = {
      questionId: currentItem.question.id,
      selectedOptionIndex: optionIndex,
      isCorrect,
      correctOptionIndex: currentItem.question.correctIndex,
      explanation: currentItem.question.explanation
    };

    setHistory(prev => {
      const newHistory = [...prev];
      newHistory[currentIndex] = { ...newHistory[currentIndex], result: resultData };
      return newHistory;
    });
  };

  const handleNext = async () => {
    // 1. If looking at old history, just move forward
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    // 2. Try to pull from Queue (INSTANT)
    if (queue.length > 0) {
      const [nextQuestion, ...remainingQueue] = queue;
      setQueue(remainingQueue);
      setHistory(prev => [...prev, { question: nextQuestion, result: null }]);
      setCurrentIndex(prev => prev + 1);

      // Refill queue if it gets low
      if (remainingQueue.length < 2 && currentSubject && currentQuizMode) {
        prefetchQuestions(3, currentSubject, currentQuizMode, currentMathsDifficulty || undefined);
      }
    } 
    // 3. Queue is empty (fallback)
    else if (currentSubject && currentQuizMode) {
      setIsGenerating(true);
      try {
        const q = await generateQuestion(currentSubject, currentQuizMode, currentMathsDifficulty || undefined);
        setHistory(prev => [...prev, { question: q, result: null }]);
        setCurrentIndex(prev => prev + 1);
        
        // Restart prefetch
        prefetchQuestions(3, currentSubject, currentQuizMode, currentMathsDifficulty || undefined);
      } catch (e) {
        console.error(e);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const resetQuizState = () => {
      setHistory([]);
      setQueue([]);
      setCurrentIndex(-1);
      setScore(0);
  }

  const handleBackToMenu = () => {
    setView('mode_selection');
    setCurrentQuizMode(null);
    setCurrentSubject(null);
    setCurrentMathsDifficulty(null);
    resetQuizState();
  };

  const handleBackToSubjects = () => {
    setView('subject_selection');
    setCurrentSubject(null);
    setCurrentMathsDifficulty(null);
    resetQuizState();
  }

  const showLangSwitch = (currentSubject && currentSubject !== 'English' && currentSubject !== 'Vocab Booster');

  const getExpiryDate = () => {
      if (currentUser?.isFreeUser) return "Lifetime Access";
      if (currentUser?.subscription?.expiresAt) {
          return new Date(currentUser.subscription.expiresAt).toLocaleDateString();
      }
      return "";
  };
    
  const renderContent = () => {
    switch (view) {
      case 'mode_selection':
        return (
          <div className="flex-1 flex flex-col justify-center items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <div className="text-center space-y-4"><h2 className="text-3xl font-bold text-white">Select Practice Mode</h2><p className={themeClasses.textMuted}>Choose how you want to prepare</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
              <button onClick={() => handleModeSelect('quiz')} className={`group p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-cyan-900/20 border-cyan-800 hover:bg-cyan-900/40`}><div className="flex flex-col items-center text-center space-y-3"><div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors"><Brain className="w-8 h-8" /></div><div><h3 className="text-xl font-bold text-white">AI Quiz</h3><p className="text-sm text-cyan-200/60 mt-1">Unlimited AI-generated questions</p></div></div></button>
              <button onClick={() => handleModeSelect('pyq')} className={`group p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] bg-yellow-900/20 border-yellow-800 hover:bg-yellow-900/40`}><div className="flex flex-col items-center text-center space-y-3"><div className="p-3 rounded-full bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20 transition-colors"><FileText className="w-8 h-8" /></div><div><h3 className="text-xl font-bold text-white">PYQ-Based</h3><p className="text-sm text-yellow-200/60 mt-1">Styled like 2018-2024 Exam Papers</p></div></div></button>
            </div>
            
            <div className="absolute bottom-0 text-xs text-slate-500 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                Plan Valid Until: <span className="text-emerald-400 font-mono">{getExpiryDate()}</span>
            </div>
          </div>
        );
      case 'subject_selection':
        return (
           <div className="flex-1 flex flex-col justify-center items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-2 text-sm font-medium opacity-60"><span className="uppercase tracking-wider">{currentQuizMode === 'pyq' ? 'PYQ Mode' : 'AI Mode'}</span></div>
            <h2 className="text-2xl font-bold text-white mb-4">Choose Subject</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
              {[ { id: 'English', icon: Book, color: 'indigo' }, { id: 'GK', icon: Book, color: 'emerald' }, { id: 'Maths', icon: Calculator, color: 'amber' }, { id: 'Vocab Booster', icon: SpellCheck, color: 'pink' }, ].map((sub) => (
                <button key={sub.id} onClick={() => handleSubjectSelect(sub.id as Subject)} className={`p-4 flex flex-col items-center justify-center rounded-xl border bg-${sub.color}-900/20 border-${sub.color}-800/50 hover:bg-${sub.color}-900/40 hover:border-${sub.color}-500/50 transition-all group`}><sub.icon className={`w-6 h-6 mb-2 text-${sub.color}-400 group-hover:scale-110 transition-transform`} /><span className={`font-bold text-${sub.color}-100`}>{sub.id}</span></button>
              ))}
            </div>
            <button onClick={handleBackToMenu} className={`mt-8 px-6 py-2 rounded-full text-sm font-medium transition-colors ${themeClasses.textMuted} hover:text-white hover:bg-white/5`}>Go Back</button>
          </div>
        );
      case 'difficulty_selection':
        return (
             <div className="flex-1 flex flex-col justify-center items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-white mb-4">Select Maths Difficulty</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                    {(['easy', 'moderate', 'hard'] as MathsDifficulty[]).map((diff) => (
                        <button key={diff} onClick={() => handleMathsDifficultySelect(diff)} className={`flex-1 p-4 rounded-xl border transition-all group hover:scale-105 active:scale-100 ${ diff === 'easy' ? 'bg-green-900/20 border-green-800/50 hover:bg-green-900/40' : diff === 'moderate' ? 'bg-yellow-900/20 border-yellow-800/50 hover:bg-yellow-900/40' : 'bg-red-900/20 border-red-800/50 hover:bg-red-900/40' }`}>
                            <div className="flex items-center justify-center space-x-2">
                               {diff === 'easy' && <ThumbsUp className="w-5 h-5 text-green-400"/>}
                               {diff === 'moderate' && <BarChart className="w-5 h-5 text-yellow-400"/>}
                               {diff === 'hard' && <Brain className="w-5 h-5 text-red-400"/>}
                               <span className="font-bold text-white capitalize">{diff}</span>
                            </div>
                        </button>
                    ))}
                </div>
                <button onClick={handleBackToSubjects} className={`mt-8 px-6 py-2 rounded-full text-sm font-medium transition-colors ${themeClasses.textMuted} hover:text-white hover:bg-white/5`}>Back to Subjects</button>
             </div>
        );
      case 'quiz_active':
        return (
           <div className="flex-1 flex flex-col items-center justify-start w-full max-w-3xl mx-auto pt-4 sm:pt-8">
             
             {/* 1. Only show Skeleton for FIRST Question */}
             {isGenerating && history.length === 0 && (
               <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full animate-pulse">
                 <div className={`w-full max-w-2xl h-64 rounded-2xl ${themeClasses.bubbleBg} border ${themeClasses.border}`}></div>
                 <div className="text-sm text-blue-300">Generating first batch of questions...</div>
               </div>
             )}

             {!isGenerating && history.length === 0 && (
                <div className="text-center mt-20"><h3 className="text-xl font-semibold">Ready to start?</h3><p className={themeClasses.textMuted}>Click "New Question" to begin.</p></div>
             )}

             {/* 2. Show Active Question Card */}
             {history.length > 0 && currentIndex >= 0 && history[currentIndex] && (
               <div className="w-full animate-in fade-in zoom-in-95 duration-300 pb-20">
                  <QuestionCard 
                    data={history[currentIndex].question} 
                    result={history[currentIndex].result} 
                    onOptionSelect={handleOptionSelect} 
                    language={language} 
                    themeClasses={themeClasses} 
                    disabled={isGenerating && history.length === 0} 
                  />
               </div>
             )}

             {/* 3. Floating Badge if Queue is Empty and Loading forced */}
             {isGenerating && history.length > 0 && (
                 <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-blue-300 px-5 py-2 rounded-full text-sm font-medium flex items-center space-x-3 shadow-2xl animate-in slide-in-from-bottom-2 fade-in ring-1 ring-blue-500/30">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     <span>Fetching more questions...</span>
                 </div>
             )}

             <div className="fixed bottom-0 left-0 w-full p-4 border-t border-white/5 backdrop-blur-xl bg-black/20 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                  <button onClick={handlePrev} disabled={currentIndex <= 0} className={`p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${themeClasses.secondaryBtn}`}><ChevronLeft className="w-6 h-6" /></button>
                  <button onClick={handleBackToMenu} className={`p-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 ${themeClasses.secondaryBtn}`}><Home className="w-6 h-6" /></button>
                  <button onClick={handleNext} className={`flex-1 flex items-center justify-center py-3 px-6 rounded-xl font-bold shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait ${themeClasses.primaryBtn}`}>
                    {isGenerating && history.length === 0 ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Starting...
                        </>
                    ) : (
                        currentIndex < history.length - 1 ? ( <>Next <ChevronRight className="w-5 h-5 ml-1" /></> ) : ( <>Next Question <RefreshCw className="w-4 h-4 ml-2" /></> )
                    )}
                  </button>
                </div>
              </div>
             <div className="h-24"></div>
           </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${themeClasses.bg} ${themeClasses.text}`}>
      <header className={`p-4 sticky top-0 z-20 border-b transition-colors duration-300 ${themeClasses.header} ${themeClasses.border} backdrop-blur-md`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/20">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-none hidden sm:block">SSC CGL/CHSL AI Quiz</h1>
              <h1 className="font-bold text-white leading-none sm:hidden">SSC Quiz</h1>
              <span className={`text-xs transition-colors ${themeClasses.textMuted}`}>
                Made by Sam
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {isAdmin && (
                <button onClick={openAdminPanel} className="px-3 py-1.5 rounded-lg bg-yellow-600 text-white text-xs font-bold uppercase tracking-wider flex items-center shadow-lg hover:bg-yellow-500 transition-colors">
                    <Shield className="w-3 h-3 mr-1" /> Admin Panel
                </button>
            )}

             <div className={`px-3 py-1.5 rounded-full border backdrop-blur-sm ${themeClasses.bubbleBg} ${themeClasses.border} flex items-center`}>
              <span className={`text-xs font-bold uppercase mr-2 hidden sm:inline ${themeClasses.textMuted}`}>Score</span>
              <span className="text-emerald-400 font-mono font-bold text-sm">{score}</span>
            </div>

            {showLangSwitch && view === 'quiz_active' && (
              <button onClick={handleLanguageToggle} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide transition-all ${ language === 'hindi' ? 'bg-orange-600 border-orange-500 text-white' : `${themeClasses.secondaryBtn}` }`}>
                <Languages className="w-4 h-4" />
                <span>{language === 'hindi' ? 'HI' : 'EN'}</span>
              </button>
            )}

            <button onClick={handleThemeChange} className={`p-2 rounded-lg transition-colors ${themeClasses.secondaryBtn}`} title="Change Theme"><Palette className="w-5 h-5" /></button>
            <button onClick={logout} className={`p-2 rounded-lg transition-colors ${themeClasses.secondaryBtn}`} title="Logout"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative p-4">
        {renderContent()}
      </main>
    </div>
  );
};