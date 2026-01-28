import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
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

          // Answer Key Section
          new Paragraph({
             text: "Đáp án & Giải thích",
             heading: HeadingLevel.HEADING_1,
             pageBreakBefore: true,
             spacing: { before: 400, after: 200 }
          }),
          
          ...questions.map((q, index) => {
             const letters = ["A", "B", "C", "D"];
             return new Paragraph({
                children: [
                   new TextRun({
                      text: `${index + 1}. ${letters[q.correctAnswerIndex]}`,
                      bold: true,
                   }),
                   new TextRun({
                      text: ` - ${q.explanation}`,
                      italics: true,
                   })
                ],
                spacing: { after: 100 }
             });
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