import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { extractTextFromFile } from '../services/fileParser';

interface FileUploadProps {
  onTextLoaded: (text: string, fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onTextLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFile = async (file: File) => {
    // Valid extensions check
    const validExtensions = ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.xls'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      alert("Vui lòng tải lên file định dạng: .txt, .md, .pdf, .docx, .xlsx");
      return;
    }

    setIsParsing(true);
    setFileName(file.name); // Set name immediately for UI feedback

    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
          throw new Error("Không tìm thấy văn bản nào trong file này (có thể là file ảnh scan).");
      }
      onTextLoaded(text, file.name);
    } catch (error: any) {
      alert(error.message);
      setFileName(null);
      onTextLoaded("", "");
    } finally {
      setIsParsing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [onTextLoaded]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFileName(null);
    onTextLoaded("", "");
  };

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          relative group cursor-pointer
          border-2 border-dashed rounded-xl p-8 transition-all duration-300 ease-in-out
          flex flex-col items-center justify-center text-center
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
          ${fileName ? 'bg-green-50 border-green-400' : ''}
        `}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".txt,.md,.pdf,.docx,.xlsx,.xls"
          onChange={handleInputChange}
          disabled={!!fileName || isParsing}
        />

        {fileName ? (
          <div className="flex flex-col items-center text-green-700 animate-in fade-in zoom-in duration-300">
            {isParsing ? (
               <Loader2 className="w-12 h-12 mb-3 animate-spin text-indigo-600" />
            ) : (
               <FileText className="w-12 h-12 mb-3" />
            )}
            
            <p className="font-semibold text-lg max-w-[200px] truncate">{fileName}</p>
            
            {isParsing ? (
               <p className="text-sm opacity-75 text-indigo-600 font-medium">Đang đọc nội dung...</p>
            ) : (
               <>
                <p className="text-sm opacity-75">Sẵn sàng tạo câu hỏi</p>
                <button 
                  onClick={clearFile}
                  className="mt-4 px-4 py-1 bg-white border border-green-200 rounded-full text-xs font-medium shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors z-10"
                >
                  Xóa file
                </button>
               </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-500">
            <div className={`p-4 rounded-full bg-slate-100 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <p className="text-lg font-medium text-slate-700 mb-1">
              Kéo thả file vào đây
            </p>
            <p className="text-sm text-slate-400">
              Hỗ trợ PDF, Word, Excel, TXT
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-center">
        <span className="h-px w-full bg-slate-200"></span>
        <span className="px-3 text-xs text-slate-400 font-medium uppercase tracking-wider">HOẶC</span>
        <span className="h-px w-full bg-slate-200"></span>
      </div>

      <div className="mt-4">
        <textarea
            className="w-full h-32 p-4 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            placeholder="Dán nội dung trực tiếp vào đây nếu bạn không có file..."
            onChange={(e) => onTextLoaded(e.target.value, "Nhập liệu thủ công")}
            disabled={!!fileName}
        />
      </div>
    </div>
  );
};

export default FileUpload;