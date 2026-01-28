import React from 'react';
import { Question } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface QuestionListProps {
  questions: Question[];
}

const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {questions.map((q, idx) => (
        <div 
          key={q.id} 
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                {idx + 1}
              </span>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-slate-900 mb-4">{q.questionText}</h3>
                
                <div className="space-y-3">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = optIdx === q.correctAnswerIndex;
                    return (
                      <div 
                        key={`${q.id}-opt-${optIdx}`}
                        className={`
                          relative flex items-center p-3 rounded-lg border text-sm transition-all
                          ${isCorrect 
                            ? 'bg-green-50 border-green-200 text-green-900' 
                            : 'bg-white border-slate-100 text-slate-600'
                          }
                        `}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 mr-3 flex-shrink-0" />
                        )}
                        <span className="font-medium">{opt}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Giải thích</p>
                  <p className="text-sm text-slate-600 italic">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;