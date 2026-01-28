import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, AlertCircle, Settings2, RefreshCw } from 'lucide-react';
import FileUpload from './components/FileUpload';
import QuestionList from './components/QuestionList';
import LoadingState from './components/LoadingState';
import { AppState, Question, QuizConfig } from './types';
import { generateQuizFromText } from './services/geminiService';
import { exportToWord } from './services/docxService';

// Ensure required libraries are available globally if using CDN or shimmed in standard env
// For this environment, we assume standard imports work as defined in services.

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [sourceText, setSourceText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Configuration
  const [config, setConfig] = useState<QuizConfig>({
    numberOfQuestions: 5,
    difficulty: 'Medium',
  });

  const handleTextLoaded = (text: string, name: string) => {
    setSourceText(text);
    setFileName(name);
    // Reset state if text is cleared
    if (!text) {
      setAppState(AppState.IDLE);
      setQuestions([]);
    }
  };

  const handleGenerate = async () => {
    if (!sourceText) return;

    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const generatedQuestions = await generateQuizFromText(sourceText, config);
      setQuestions(generatedQuestions);
      setAppState(AppState.REVIEW);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi.");
      setAppState(AppState.ERROR);
    }
  };

  const handleExport = () => {
    if (questions.length === 0) return;
    exportToWord(questions, `Trắc nghiệm: ${fileName || "Nội dung tạo bởi AI"}`);
  };

  const difficultyLabels: Record<string, string> = {
    'Easy': 'Dễ',
    'Medium': 'Vừa',
    'Hard': 'Khó'
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              Note<span className="text-indigo-600">Quiz</span> AI
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="hidden sm:inline">Cung cấp bởi Gemini 3</span>
            <a href="#" className="text-indigo-600 font-medium hover:text-indigo-700">Trợ giúp</a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro Section */}
        {appState === AppState.IDLE && !sourceText && (
           <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Biến ghi chú của bạn thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">bộ câu hỏi hoàn hảo.</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Tải lên tài liệu học tập, bài viết hoặc tài liệu hướng dẫn. Chúng tôi sẽ tạo ra các câu hỏi trắc nghiệm nghiêm ngặt, bám sát ngữ cảnh ngay lập tức. Không bịa đặt, chỉ có sự thật.
              </p>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* File Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs">1</span>
                  Tài liệu nguồn
                </h3>
              </div>
              <div className="p-4">
                <FileUpload onTextLoaded={handleTextLoaded} />
                {sourceText && (
                  <div className="mt-2 text-xs text-right text-slate-400">
                    {sourceText.length.toLocaleString()} ký tự đã tải
                  </div>
                )}
              </div>
            </div>

            {/* Configuration Card */}
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-1 transition-opacity duration-300 ${!sourceText ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs">2</span>
                  Cấu hình
                </h3>
                <Settings2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Số lượng câu hỏi</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={config.numberOfQuestions}
                      onChange={(e) => setConfig({...config, numberOfQuestions: parseInt(e.target.value)})}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-sm font-bold text-indigo-600 w-8">{config.numberOfQuestions}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Độ khó</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfig({...config, difficulty: level as any})}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium transition-all
                          ${config.difficulty === level 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }
                        `}
                      >
                        {difficultyLabels[level]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={appState === AppState.PROCESSING}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {appState === AppState.PROCESSING ? (
                    <span className="flex items-center gap-2">Đang tạo...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Tạo câu hỏi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-8">
            {appState === AppState.IDLE && (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="font-medium">Câu hỏi sẽ hiển thị ở đây</p>
              </div>
            )}

            {appState === AppState.PROCESSING && (
              <LoadingState />
            )}

            {appState === AppState.ERROR && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-900 font-semibold mb-1">Tạo thất bại</h3>
                  <p className="text-red-700 text-sm">{errorMsg}</p>
                  <button 
                    onClick={() => setAppState(AppState.IDLE)}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            {appState === AppState.REVIEW && questions.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Bộ câu hỏi đã tạo</h2>
                  <div className="flex gap-2">
                     <button 
                      onClick={handleGenerate}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Tạo lại
                    </button>
                    <button 
                      onClick={handleExport}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md shadow-green-100 transition-all font-medium text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Xuất Word
                    </button>
                  </div>
                </div>

                <QuestionList questions={questions} />
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;