import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuizConfig } from "../types";

// Lấy API Key từ biến môi trường
const apiKey = process.env.GEMINI_API_KEY;

const getAiClient = () => {
  if (!apiKey) {
    throw new Error("Thiếu API Key. Vui lòng cấu hình GEMINI_API_KEY trong Settings của Vercel.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuizFromText = async (
  textContext: string,
  config: QuizConfig,
  previousQuestions: string[] = []
): Promise<Question[]> => {
  if (!textContext || textContext.trim().length === 0) {
    throw new Error("Không có nội dung văn bản hoặc đường dẫn nào được cung cấp.");
  }

  // Map độ khó
  const difficultyMap: Record<string, string> = {
    'Easy': 'Dễ',
    'Medium': 'Trung bình',
    'Hard': 'Khó'
  };
  const vietnameseDifficulty = difficultyMap[config.difficulty] || 'Trung bình';

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

  // Hàm helper để gọi model cụ thể
  const generateWithModel = async (modelId: string) => {
    const ai = getAiClient();
    return await ai.models.generateContent({
      model: modelId, 
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
              correctAnswerIndex: { type: Type.INTEGER, description: "Index của đáp án đúng (0-3)" },
              explanation: { type: Type.STRING, description: "Giải thích chi tiết" },
            },
            required: ["questionText", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });
  };

  try {
    let response;
    
    try {
        // CHIẾN LƯỢC:
        // 1. Thử dùng gemini-1.5-flash-001 (Bản ổn định, rẻ, nhanh)
        response = await generateWithModel("gemini-1.5-flash-001");
    } catch (err: any) {
        // 2. Nếu thất bại (ví dụ 404 Not Found), thử fallback sang gemini-1.5-pro-001
        console.warn(`Lỗi với gemini-1.5-flash-001 (${err.message}), đang thử model dự phòng...`);
        
        // Chỉ thử lại nếu lỗi là do không tìm thấy model hoặc lỗi server,
        // Nếu lỗi 429 (hết quota) thì thường các model khác cũng bị, nhưng cứ thử Pro cho chắc.
        if (err.message?.includes("404") || err.message?.includes("not found") || err.status === 503) {
             response = await generateWithModel("gemini-1.5-pro-001");
        } else {
            throw err; // Ném lỗi luôn nếu là lỗi khác (ví dụ sai API Key)
        }
    }

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI không trả về dữ liệu.");

    const rawQuestions = JSON.parse(jsonText);
    if (!Array.isArray(rawQuestions)) throw new Error("Dữ liệu JSON từ AI bị lỗi định dạng.");

    return rawQuestions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      questionText: q.questionText,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation,
    }));

  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Xử lý thông báo lỗi thân thiện với người dùng
    if (error.message?.includes("429") || error.status === 429) {
         throw new Error("Hệ thống đang quá tải (Google Free Tier Quota). Vui lòng đợi 1-2 phút rồi thử lại.");
    }
    if (error.message?.includes("404") || error.status === 404) {
         throw new Error("Không kết nối được với Model AI (404). Vui lòng thử lại sau.");
    }
    if (error.message?.includes("API Key")) {
        throw new Error("Chưa cấu hình API Key chính xác.");
    }

    throw new Error(error.message || "Lỗi kết nối Gemini AI.");
  }
};
