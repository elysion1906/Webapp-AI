import React, { useState, useRef } from 'react';
import { FileText, Download, Sparkles, AlertCircle, Settings2, RefreshCw, CheckSquare, Square, FileUp, X, Loader2 } from 'lucide-react';
import FileUpload from './components/FileUpload';
import QuestionList from './components/QuestionList';
import LoadingState from './components/LoadingState';
import { AppState, Question, QuizConfig, Source } from './types';
import { generateQuizFromText } from './services/geminiService';
import { exportToWord } from './services/docxService';
import { extractTextFromFile } from './services/fileParser';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [sources, setSources] = useState<Source[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isParsingExclusion, setIsParsingExclusion] = useState(false);
  
  const exclusionFileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<QuizConfig>({
    numberOfQuestions: 10,
    difficulty: 'Medium',
    preventDuplicates: false,
    excludedContent: undefined,
    excludedFileName: undefined
  });

  const handleAddSource = (newSource: Source) => {
    setSources(prev => [...prev, newSource]);
    if (appState === AppState.REVIEW) setAppState(AppState.IDLE); 
  };

  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    if (sources.length <= 1) {
        setQuestions([]);
        setHistory([]);
        setAppState(AppState.IDLE);
    }
  };

  const handleExclusionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExclusion(true);
    try {
      const text = await extractTextFromFile(file);
      setConfig(prev => ({
        ...prev,
        excludedContent: text,
        excludedFileName: file.name,
        preventDuplicates: true // Auto enable if file uploaded
      }));
    } catch (err: any) {
      alert("Lỗi khi đọc file: " + err.message);
    } finally {
      setIsParsingExclusion(false);
      if (exclusionFileInputRef.current) exclusionFileInputRef.current.value = '';
    }
  };

  const clearExclusionFile = () => {
    setConfig(prev => ({
      ...prev,
      excludedContent: undefined,
      excludedFileName: undefined
    }));
  };

  const handleGenerate = async () => {
    if (sources.length === 0) return;
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    const fullContext = sources.map(s => 
      s.type === 'url' ? `\nURL: ${s.name}\n` : `\nFILE ${s.name}:\n${s.content}\n`
    ).join('\n');

    try {
      const generatedQuestions = await generateQuizFromText(fullContext, config, history);
      setQuestions(generatedQuestions);
      setHistory(prev => [...prev, ...generatedQuestions.map(q => q.questionText)]);
      setAppState(AppState.REVIEW);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi.");
      setAppState(AppState.ERROR);
    }
  };

  const handleExport = () => {
    if (questions.length === 0) return;
    exportToWord(questions, `Trắc nghiệm: ${sources[0]?.name || "Tổng hợp"}`);
  };

  const difficultyLabels: Record<string, string> = {
    'Easy': 'Dễ',
    'Medium': 'Vừa',
    'Hard': 'Khó'
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
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
            <span className="text-slate-600 font-medium">Bản quyền thuộc về Nguyễn Võ Đức Toàn</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState === AppState.IDLE && sources.length === 0 && (
           <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Biến tài liệu thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">bộ đề thi trắc nghiệm.</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Tải lên tài liệu nguồn, AI sẽ tự động soạn câu hỏi kèm giải thích chi tiết.
              </p>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
              <div className="p-4 border-b border-slate-100 font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs">1</span>
                Nguồn tài liệu
              </div>
              <div className="p-4">
                <FileUpload sources={sources} onAddSource={handleAddSource} onRemoveSource={handleRemoveSource} />
              </div>
            </div>

            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-1 transition-opacity duration-300 ${sources.length === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center font-semibold text-slate-800">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs">2</span>
                  Cấu hình
                </div>
                <Settings2 className="w-4 h-4 text-slate-400" />
              </div>
              <div className="p-5 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Số lượng câu hỏi</label>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{config.numberOfQuestions}</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" value={config.numberOfQuestions}
                    onChange={(e) => setConfig({...config, numberOfQuestions: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Độ khó</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfig({...config, difficulty: level as any})}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${config.difficulty === level ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        {difficultyLabels[level]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setConfig({...config, preventDuplicates: !config.preventDuplicates})}
                    className="flex items-center gap-3 w-full text-left group"
                  >
                    <div className={config.preventDuplicates ? 'text-indigo-600' : 'text-slate-400'}>
                      {config.preventDuplicates ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium text-slate-700">Tránh trùng câu hỏi cũ</span>
                  </button>

                  <div className="pl-8 space-y-2">
                    <input 
                      type="file" ref={exclusionFileInputRef} className="hidden" 
                      accept=".pdf,.docx,.txt,.md,.xlsx,.xls,.pptx"
                      onChange={handleExclusionFileUpload}
                    />
                    
                    {!config.excludedFileName ? (
                      <button 
                        onClick={() => exclusionFileInputRef.current?.click()}
                        disabled={isParsingExclusion}
                        className="text-xs flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-full justify-center transition-colors"
                      >
                        {isParsingExclusion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileUp className="w-3.5 h-3.5" />}
                        Tải file câu hỏi cũ cần tránh
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-100 text-[11px]">
                        <span className="truncate max-w-[150px]" title={config.excludedFileName}>{config.excludedFileName}</span>
                        <button onClick={clearExclusionFile} className="p-0.5 hover:bg-green-100 rounded text-green-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 italic">
                      AI sẽ đọc file này để không soạn câu giống.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={appState === AppState.PROCESSING}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {appState === AppState.PROCESSING ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {questions.length > 0 ? "Tạo thêm câu hỏi" : "Tạo câu hỏi ngay"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {appState === AppState.IDLE && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 p-10">
                 <FileText className="w-12 h-12 text-slate-300 mb-4" />
                 <p className="font-medium">Nội dung câu hỏi sẽ hiển thị tại đây</p>
                 <p className="text-sm mt-2">Vui lòng chọn nguồn tài liệu ở cột bên trái</p>
              </div>
            )}
            {appState === AppState.PROCESSING && <LoadingState />}
            {appState === AppState.ERROR && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <div><h3 className="text-red-900 font-semibold">Đã xảy ra lỗi</h3><p className="text-red-700 text-sm">{errorMsg}</p></div>
              </div>
            )}
            {appState === AppState.REVIEW && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Bộ câu hỏi mới tạo</h2>
                  <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 font-semibold transition-all">
                    <Download className="w-4 h-4" /> Xuất Word
                  </button>
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