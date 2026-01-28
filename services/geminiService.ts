import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizConfig } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizFromText = async (
  textContext: string,
  config: QuizConfig
): Promise<Question[]> => {
  if (!textContext || textContext.trim().length === 0) {
    throw new Error("Không có nội dung văn bản được cung cấp.");
  }

  // Map difficulty to Vietnamese for the prompt
  const difficultyMap: Record<string, string> = {
    'Easy': 'Dễ',
    'Medium': 'Trung bình',
    'Hard': 'Khó'
  };
  const vietnameseDifficulty = difficultyMap[config.difficulty] || 'Trung bình';

  const prompt = `
    Bạn là một người soạn đề thi trắc nghiệm nghiêm khắc. Nhiệm vụ của bạn là tạo ra ${config.numberOfQuestions} câu hỏi trắc nghiệm dựa CHỈ trên văn bản được cung cấp dưới đây.

    Độ khó: ${vietnameseDifficulty}.

    Quy tắc:
    1. KHÔNG sử dụng kiến thức bên ngoài. Câu trả lời phải tìm thấy trực tiếp trong văn bản.
    2. Nếu văn bản quá ngắn để tạo đủ ${config.numberOfQuestions} câu hỏi, hãy tạo nhiều nhất có thể (tối thiểu 1 câu).
    3. Mỗi câu hỏi phải có chính xác 4 lựa chọn.
    4. Cung cấp giải thích ngắn gọn tại sao đáp án đó đúng dựa trên văn bản.
    5. Ngôn ngữ đầu ra: Tiếng Việt.
    
    Văn bản đầu vào:
    """
    ${textContext.slice(0, 30000)} 
    """
    (Lưu ý: Văn bản được cắt bớt 30k ký tự đầu để an toàn, mặc dù mô hình có thể xử lý nhiều hơn)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Efficient model for large context processing
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING, description: "Nội dung câu hỏi bằng tiếng Việt" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING, description: "Các lựa chọn trả lời bằng tiếng Việt" },
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Chỉ số của đáp án đúng (0-3)" },
              explanation: { type: Type.STRING, description: "Giải thích bằng tiếng Việt" },
            },
            required: ["questionText", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Không nhận được phản hồi từ Gemini.");
    }

    const rawQuestions = JSON.parse(jsonText);

    // Map to our internal type and add IDs
    return rawQuestions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Không thể tạo câu hỏi. Vui lòng đảm bảo nội dung đầu vào đầy đủ và thử lại.");
  }
};