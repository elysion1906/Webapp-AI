import * as pdfjsLibProxy from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Handle potentially different export structures (ESM vs CJS wrapper)
// esm.sh often wraps the library in a default export
const pdfjsLib = (pdfjsLibProxy as any).default || pdfjsLibProxy;

// Set up PDF.js worker
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

/**
 * Extracts text from a PDF file using pdfjs-dist
 */
const parsePdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  
  if (!pdfjsLib.getDocument) {
    throw new Error("Không thể khởi tạo trình đọc PDF.");
  }

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n\n";
  }

  return fullText;
};

/**
 * Extracts text from a DOCX file using Mammoth
 */
const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
  return result.value;
};

/**
 * Extracts text from an Excel file using XLSX
 */
const parseExcel = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  let fullText = "";
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to text (tab separated)
    const text = XLSX.utils.sheet_to_txt(sheet);
    fullText += `--- Sheet: ${sheetName} ---\n${text}\n\n`;
  });

  return fullText;
};

/**
 * Main parser function router
 */
export const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.pdf')) {
      return await parsePdf(file);
    } 
    else if (fileName.endsWith('.docx')) {
      return await parseDocx(file);
    } 
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return await parseExcel(file);
    } 
    else if (fileType === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await file.text();
    } 
    else {
      throw new Error("Định dạng file không được hỗ trợ.");
    }
  } catch (error) {
    console.error("Error parsing file:", error);
    throw new Error(`Không thể đọc file: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
  }
};