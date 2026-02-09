import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import FileSaver from "file-saver";
import { Question } from "../types";

export const exportToWord = async (questions: Question[], title: string = "Đề thi trắc nghiệm") => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          new Paragraph({
            text: `Số lượng câu hỏi: ${questions.length}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // --- QUESTION SECTION ---
          ...questions.flatMap((q, index) => {
            const questionParagraph = new Paragraph({
              children: [
                new TextRun({
                  text: `Câu ${index + 1}: ${q.questionText}`,
                  bold: true,
                  size: 24, // 12pt
                }),
              ],
              spacing: { before: 200, after: 100 },
            });

            const optionParagraphs = q.options.map((opt, optIndex) => {
              const letters = ["A", "B", "C", "D"];
              return new Paragraph({
                children: [
                  new TextRun({
                    text: `${letters[optIndex]}. ${opt}`,
                    size: 22, // 11pt
                  }),
                ],
                indent: { left: 720 }, // 0.5 inch
                spacing: { after: 50 },
              });
            });

            return [questionParagraph, ...optionParagraphs];
          }),

          // --- ANSWER KEY SECTION ---
          new Paragraph({
             text: "ĐÁP ÁN & GIẢI THÍCH CHI TIẾT",
             heading: HeadingLevel.HEADING_1,
             pageBreakBefore: true,
             alignment: AlignmentType.CENTER,
             spacing: { before: 400, after: 400 },
             border: {
                 bottom: { style: BorderStyle.SINGLE, size: 6, color: "auto", space: 1 },
             }
          }),
          
          ...questions.flatMap((q, index) => {
             const letters = ["A", "B", "C", "D"];
             return [
                // Repeat Question for context
                new Paragraph({
                   children: [
                      new TextRun({
                         text: `Câu ${index + 1}: `,
                         bold: true,
                         size: 24,
                      }),
                      new TextRun({
                         text: q.questionText,
                         italics: true,
                         size: 22,
                      })
                   ],
                   spacing: { before: 300, after: 100 },
                   shading: { fill: "F5F5F5" } // Light gray background for separation
                }),
                
                // Correct Answer
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Đáp án đúng: ",
                            bold: true,
                            color: "2E7D32" // Dark Green
                        }),
                        new TextRun({
                            text: `${letters[q.correctAnswerIndex]}. ${q.options[q.correctAnswerIndex]}`,
                            bold: true,
                            color: "2E7D32"
                        })
                    ],
                    indent: { left: 360 },
                    spacing: { after: 100 }
                }),

                // Explanation
                new Paragraph({
                   children: [
                      new TextRun({
                         text: "Giải thích: ",
                         bold: true,
                         underline: {}
                      }),
                      new TextRun({
                         text: q.explanation,
                      })
                   ],
                   indent: { left: 360 },
                   spacing: { after: 200 }
                })
             ];
          })
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  // Handle different export types for file-saver in ESM environments
  const save = (FileSaver as any).saveAs || FileSaver;
  save(blob, "de-thi-trac-nghiem.docx");
};