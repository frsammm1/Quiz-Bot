import React from 'react';
import { QuestionData, ResultData, Subject, Language, MathsDifficulty } from '../types';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';

interface QuestionCardProps {
  data: QuestionData;
  result: ResultData | null;
  onOptionSelect: (optionIndex: number) => void;
  language: Language;
  themeClasses: Record<string, string>;
  disabled?: boolean;
}

// Helper to format text with basic HTML tags
const formatText = (text: string) => {
  if (!text) return null;
  
  const parts = text.split(/(<\/?\s*(?:b|i|u|strong|em)\s*>)/gi);
  
  const elements: React.ReactNode[] = [];
  let bold = false;
  let italic = false;
  let underline = false;

  parts.forEach((part, index) => {
    const lower = part.toLowerCase().replace(/\s+/g, '');
    
    if (lower.startsWith('<') && lower.endsWith('>')) {
      if (lower.includes('b>') || lower.includes('strong>')) {
        bold = !lower.startsWith('</');
      } else if (lower.includes('i>') || lower.includes('em>')) {
        italic = !lower.startsWith('</');
      } else if (lower.includes('u>')) {
        underline = !lower.startsWith('</');
      }
    } else {
      if (part) {
        let className = '';
        if (bold) className += 'font-bold text-blue-200 ';
        if (italic) className += 'italic ';
        if (underline) className += 'underline decoration-2 underline-offset-4 decoration-blue-400 ';
        
        elements.push(<span key={index} className={className || undefined}>{part}</span>);
      }
    }
  });

  return elements.length > 0 ? elements : text;
};


// Special formatter for Sentence Rearrangement questions
const formatRearrangementQuestion = (text: string, language: Language): React.ReactNode => {
    // Find the first occurrence of a P/Q/R/S marker to split instruction from parts
    const match = text.match(/(?=\s[PQRS]\.\s)/);
    if (!match || typeof match.index === 'undefined') {
      return formatText(text); // Fallback if no markers found
    }

    const instructionPart = text.substring(0, match.index);
    const partsStr = text.substring(match.index);

    // Handle bilingual instruction
    const instructionParts = instructionPart.split('||');
    const localizedInstruction = language === 'hindi' 
      ? instructionParts[0].trim() 
      : (instructionParts[1] || instructionParts[0]).trim();
    
    // Split the P, Q, R, S parts
    const questionParts = partsStr.trim().split(/(?=\s[PQRS]\.\s)/g);

    return (
      <div>
        <div className="mb-4">{formatText(localizedInstruction)}</div>
        {questionParts.map((part, index) => (
          <div key={index} className="mt-2">
            {formatText(part.trim())}
          </div>
        ))}
      </div>
    );
};


// Helper to extract language specific text
const getLocalizedText = (text: string, subject: Subject, language: Language): React.ReactNode => {
  // Check if it's an English rearrangement question first and apply special formatting
  if (subject === 'English' && text.includes(' P. ') && text.includes(' Q. ') && text.includes(' R. ')) {
    return formatRearrangementQuestion(text, language);
  }

  // Original logic for all other questions
  if (subject === 'English' || subject === 'Vocab Booster') {
    return formatText(text);
  }

  const parts = text.split('||');
  if (parts.length < 2) {
    return formatText(text);
  }
  const content = language === 'hindi' ? parts[0].trim() : parts[1].trim();
  return formatText(content);
};

const getSubjectBadgeClass = (subject: Subject) => {
  switch (subject) {
    case 'English': return 'bg-indigo-900 text-indigo-300';
    case 'GK': return 'bg-emerald-900 text-emerald-300';
    case 'Maths': return 'bg-amber-900 text-amber-300';
    case 'Vocab Booster': return 'bg-pink-900 text-pink-300';
    default: return 'bg-slate-700 text-slate-300';
  }
};

const getDifficultyBadgeClass = (difficulty: MathsDifficulty) => {
    switch (difficulty) {
        case 'easy': return 'bg-green-900/80 text-green-300 border border-green-700/50';
        case 'moderate': return 'bg-yellow-900/80 text-yellow-300 border border-yellow-700/50';
        case 'hard': return 'bg-red-900/80 text-red-300 border border-red-700/50';
    }
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  data, 
  result, 
  onOptionSelect, 
  language,
  themeClasses,
  disabled 
}) => {
  const isPYQ = data.mode === 'pyq';
  
  return (
    <div className={`w-full max-w-2xl mx-auto p-1 rounded-2xl ${themeClasses.bubbleBg} border ${themeClasses.border} shadow-xl transition-all duration-300`}>
      {/* Header Badge */}
      <div className="flex justify-between items-center p-4 pb-2">
        <div className="flex space-x-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getSubjectBadgeClass(data.subject)}`}>
            {data.subject}
          </span>
          {isPYQ && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-900/80 text-yellow-300 border border-yellow-700/50">
              PYQ-Based
            </span>
          )}
          {data.subject === 'Maths' && data.difficulty && (
             <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${getDifficultyBadgeClass(data.difficulty)}`}>
               {data.difficulty}
             </span>
          )}
        </div>
        {result && (
          <div className={`flex items-center px-3 py-1 rounded-full border ${result.isCorrect ? 'bg-green-900/30 border-green-700/50 text-green-400' : 'bg-red-900/30 border-red-700/50 text-red-400'}`}>
            {result.isCorrect ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            <span className="text-xs font-bold uppercase">{result.isCorrect ? 'Solved' : 'Missed'}</span>
          </div>
        )}
      </div>

      {/* Question Text */}
      <div className="px-6 py-4">
        <div className="text-lg md:text-xl font-medium text-white leading-relaxed mb-6 min-h-[60px]">
          {getLocalizedText(data.question, data.subject, language)}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {data.options.map((opt, idx) => {
            let stateClass = `${themeClasses.optionBg} ${themeClasses.border} text-slate-200`;
            
            if (result) {
              if (idx === result.correctOptionIndex) {
                stateClass = 'bg-green-600 border-green-500 text-white ring-2 ring-green-400/30';
              } else if (idx === result.selectedOptionIndex && !result.isCorrect) {
                stateClass = 'bg-red-900/50 border-red-500 text-red-200';
              } else {
                stateClass = 'bg-slate-800/50 border-slate-800 text-slate-500 opacity-60';
              }
            } else {
              stateClass = `hover:border-blue-500 hover:bg-slate-700 ${themeClasses.optionBg} ${themeClasses.border} text-slate-200`;
            }

            return (
              <button
                key={idx}
                onClick={() => !result && !disabled && onOptionSelect(idx)}
                disabled={!!result || disabled}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 border flex items-center group ${stateClass}`}
              >
                <span className={`mr-4 w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  result && idx === result.correctOptionIndex ? 'bg-green-500 text-white' : 
                  result && idx === result.selectedOptionIndex && !result.isCorrect ? 'bg-red-500 text-white' :
                  'bg-white/10 group-hover:bg-white/20'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-sm md:text-base">
                  {getLocalizedText(opt, data.subject, language)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Footer */}
      {result && (
        <div className={`mx-4 mb-4 mt-2 p-4 rounded-xl border border-white/5 ${themeClasses.bubbleSecondaryBg}`}>
          <div className="flex items-center text-blue-300 mb-2 text-xs uppercase font-bold tracking-wider">
            <BookOpen className="w-3 h-3 mr-1" /> Explanation
          </div>
          <div className="text-slate-300 text-sm leading-relaxed">
            {getLocalizedText(result.explanation, data.subject, language)}
          </div>
        </div>
      )}
    </div>
  );
};