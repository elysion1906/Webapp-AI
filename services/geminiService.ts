import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizConfig } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateQuizFromText = async (
  textContext: string,
  config: QuizConfig,
  previousQuestions: string[] = []
): Promise<Question[]> => {
  if (!textContext || textContext.trim().length === 0) {
    throw new Error("Không có nội dung văn bản hoặc đường dẫn nào được cung cấp.");
  }

  // Map difficulty to Vietnamese for the prompt
  const difficultyMap: Record<string, string> = {
    'Easy': 'Dễ',
    'Medium': 'Trung bình',
    'Hard': 'Khó'
  };
  const vietnameseDifficulty = difficultyMap[config.difficulty] || 'Trung bình';

  // Construct the negative constraint
  let avoidInstruction = "";
  
  const historyQuestions = previousQuestions.length > 0 
    ? `DANH SÁCH CÂU HỎI ĐÃ TẠO TRONG PHIÊN NÀY:\n${previousQuestions.map((q, i) => `${i+1}. ${q}`).join('\n')}` 
    : "";

  const fileExclusion = config.excludedContent 
    ? `NỘI DUNG CÂU HỎI CŨ CẦN TRÁNH (TỪ FILE BẠN TẢI LÊN):\n"""\n${config.excludedContent}\n"""` 
    : "";

  if (config.preventDuplicates && (historyQuestions || fileExclusion)) {
    avoidInstruction = `
    QUAN TRỌNG: Bạn KHÔNG ĐƯỢC phép tạo lại các câu hỏi trùng lặp hoặc có nội dung tương tự với các dữ liệu sau đây. Hãy tìm những ý tưởng mới từ tài liệu nguồn.
    
    ${historyQuestions}
    ${fileExclusion}
    `;
  }

  const prompt = `
    Bạn là một chuyên gia soạn đề thi trắc nghiệm chuyên nghiệp. Nhiệm vụ của bạn là tạo ra đúng ${config.numberOfQuestions} câu hỏi trắc nghiệm dựa trên nội dung được cung cấp.
    
    Nội dung đầu vào:
    1. Văn bản trích xuất từ file hoặc nhập tay.
    2. Các đường dẫn (URL) - hãy sử dụng Search để truy cập nội dung.

    Yêu cầu về độ khó: ${vietnameseDifficulty}.

    ${avoidInstruction}

    Quy tắc bắt buộc:
    1. Câu hỏi và đáp án phải bám sát nội dung nguồn.
    2. Mỗi câu hỏi có đúng 4 lựa chọn (A, B, C, D).
    3. Cung cấp giải thích chi tiết tại sao đáp án đó đúng.
    4. Ngôn ngữ: Tiếng Việt.
    5. Định dạng đầu ra: JSON.
    
    NỘI DUNG NGUỒN ĐỂ SOẠN ĐỀ:
    """
    ${textContext.slice(0, 50000)} 
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "Nội dung câu hỏi" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index của đáp án đúng" },
              explanation: { type: Type.STRING, description: "Giải thích chi tiết" },
            },
            required: ["questionText", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Không nhận được phản hồi.");

    const rawQuestions = JSON.parse(jsonText);
    if (!Array.isArray(rawQuestions)) throw new Error("Dữ liệu không đúng định dạng.");

    return rawQuestions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    }));

  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Lỗi khi tạo câu hỏi. Vui lòng thử lại.");
  }
};
