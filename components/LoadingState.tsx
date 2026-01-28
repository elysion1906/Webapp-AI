import React from 'react';
import { Sparkles } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
        <div className="relative bg-white p-4 rounded-full shadow-xl border border-indigo-100">
            <Sparkles className="w-8 h-8 text-indigo-600 animate-spin-slow" />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-slate-800">Đang phân tích ngữ cảnh</h3>
      <p className="mt-2 text-slate-500 max-w-sm text-center">
        Gemini đang đọc tài liệu của bạn và soạn thảo các câu hỏi trắc nghiệm bám sát nội dung...
      </p>
      
      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-0"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
      </div>
    </div>
  );
};

export default LoadingState;