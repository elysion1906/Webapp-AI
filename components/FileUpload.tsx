import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Link as LinkIcon, X, Loader2, Plus, File, Trash2, Globe } from 'lucide-react';
import { extractTextFromFile } from '../services/fileParser';
import { Source } from '../types';

interface FileUploadProps {
  sources: Source[];
  onAddSource: (source: Source) => void;
  onRemoveSource: (id: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ sources, onAddSource, onRemoveSource }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'text'>('upload');
  const [manualText, setManualText] = useState('');

  // File Handling
  const handleFile = async (file: File) => {
    const validExtensions = ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.xls', '.pptx'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      alert(`File ${file.name} không được hỗ trợ. Vui lòng dùng: .txt, .md, .pdf, .docx, .xlsx, .pptx`);
      return;
    }

    setIsParsing(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
          throw new Error(`File ${file.name} không có nội dung văn bản.`);
      }
      onAddSource({
        id: Date.now().toString() + Math.random(),
        type: 'file',
        name: file.name,
        content: text
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsParsing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => handleFile(file));
    }
  }, [onAddSource]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // URL Handling
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    try {
        new URL(urlInput); // Validate URL format
        onAddSource({
            id: Date.now().toString() + Math.random(),
            type: 'url',
            name: urlInput,
            content: `URL_REFERENCE: ${urlInput}` // The content is the URL itself for Gemini to process
        });
        setUrlInput('');
    } catch (e) {
        alert("Vui lòng nhập một đường dẫn hợp lệ (ví dụ: https://example.com)");
    }
  };

  // Manual Text Handling
  const handleAddText = () => {
      if (!manualText.trim()) return;
      onAddSource({
          id: Date.now().toString() + Math.random(),
          type: 'text',
          name: 'Văn bản nhập tay',
          content: manualText
      });
      setManualText('');
  };

  return (
    <div className="w-full space-y-4">
      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            File
        </button>
        <button 
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Link (URL)
        </button>
        <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Văn bản
        </button>
      </div>

      {/* Input Areas */}
      <div className="min-h-[160px]">
        {activeTab === 'upload' && (
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
                relative h-40 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out
                flex flex-col items-center justify-center text-center cursor-pointer
                ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                `}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".txt,.md,.pdf,.docx,.xlsx,.xls,.pptx"
                    multiple
                    onChange={(e) => {
                        if (e.target.files) Array.from(e.target.files).forEach(handleFile);
                        e.target.value = ''; // Reset to allow re-uploading same file
                    }}
                    disabled={isParsing}
                />
                {isParsing ? (
                    <div className="flex flex-col items-center text-indigo-600">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-sm font-medium">Đang đọc file...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-slate-500 pointer-events-none">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="text-sm font-medium">Kéo thả hoặc chọn nhiều file</p>
                        <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel, PowerPoint, TXT</p>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'link' && (
            <div className="h-40 flex flex-col justify-center bg-slate-50 rounded-xl border border-slate-200 p-4">
                <label className="text-sm font-medium text-slate-700 mb-2">Nhập đường dẫn bài viết/tài liệu:</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="url" 
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="https://vnexpress.net/bai-viet..."
                            className="w-full pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-400"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                        />
                    </div>
                    <button 
                        onClick={handleAddUrl}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    * AI sẽ tự động truy cập link để đọc nội dung (Yêu cầu link công khai).
                </p>
            </div>
        )}

        {activeTab === 'text' && (
             <div className="h-40 flex flex-col bg-slate-50 rounded-xl border border-slate-200 p-2">
                 <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Dán nội dung vào đây..."
                    className="flex-1 w-full p-2 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
                 />
                 <div className="flex justify-end pt-2 border-t border-slate-200">
                    <button 
                        onClick={handleAddText}
                        disabled={!manualText.trim()}
                        className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Thêm văn bản
                    </button>
                 </div>
             </div>
        )}
      </div>

      {/* Source List */}
      {sources.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Nguồn đã chọn ({sources.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {sources.map((source) => (
                    <div key={source.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                ${source.type === 'file' ? 'bg-orange-50 text-orange-600' : ''}
                                ${source.type === 'url' ? 'bg-blue-50 text-blue-600' : ''}
                                ${source.type === 'text' ? 'bg-gray-50 text-gray-600' : ''}
                            `}>
                                {source.type === 'file' && <File className="w-4 h-4" />}
                                {source.type === 'url' && <LinkIcon className="w-4 h-4" />}
                                {source.type === 'text' && <FileText className="w-4 h-4" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-slate-700 truncate block max-w-[200px]" title={source.name}>
                                    {source.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {source.type === 'url' ? 'Link tham khảo' : `${source.content.length.toLocaleString()} ký tự`}
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={() => onRemoveSource(source.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
          </div>
      )}
    </div>
  );
};

export default FileUpload;