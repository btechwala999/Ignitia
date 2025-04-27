const puppeteer = require('puppeteer');
const logger = require('../../../utils/logger');
const fs = require('fs');
const path = require('path');

class PDFService {
  /**
   * Generate HTML template for question paper
   */
  generateHTML(questionPaper) {
    const { 
      title, 
      subject, 
      description, 
      totalMarks, 
      duration, 
      questions, 
      educationBoard, 
      class: className, 
      syllabus, 
      educationalLevel,
      topic
    } = questionPaper;
    
    // Sort questions by type: MCQs first, then short, then long, etc.
    const questionTypeOrder = ['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'];
    const sortedQuestions = [...questions].sort((a, b) => {
      const typeIndexA = questionTypeOrder.indexOf(a.type);
      const typeIndexB = questionTypeOrder.indexOf(b.type);
      return typeIndexA - typeIndexB;
    });
    
    // Group questions by type
    const questionsByType = {};
    sortedQuestions.forEach(question => {
      if (!questionsByType[question.type]) {
        questionsByType[question.type] = [];
      }
      questionsByType[question.type].push(question);
    });
    
    // Calculate total questions for each part
    const partA = questionsByType['mcq'] || [];
    const partB = [];
    // Add short, diagram, code, hots, case_study questions to Part B
    ['short', 'diagram', 'code', 'hots', 'case_study'].forEach(type => {
      if (questionsByType[type]) {
        partB.push(...questionsByType[type]);
      }
    });
    
    // All long questions go to Part C
    const partC = questionsByType['long'] || [];
    
    // Generate Part A questions (MCQs)
    let partAHTML = '';
    if (partA.length > 0) {
      partA.forEach((question, index) => {
        partAHTML += `
          <div class="question">
            <div class="question-number">${index + 1}.</div>
            <div class="question-content">
              <div class="question-text">${question.text}</div>
              <div class="options-grid">
                <div class="option">A) ${question.options && question.options[0] ? question.options[0] : 'Option A'}</div>
                <div class="option">B) ${question.options && question.options[1] ? question.options[1] : 'Option B'}</div>
                <div class="option">C) ${question.options && question.options[2] ? question.options[2] : 'Option C'}</div>
                <div class="option">D) ${question.options && question.options[3] ? question.options[3] : 'Option D'}</div>
              </div>
            </div>
            <div class="marking-grid">
              <div class="marking-cell">1</div>
            </div>
          </div>
        `;
      });
    }
    
    // Generate Part B questions
    let partBHTML = '';
    
    if (partB.length > 0) {
      partB.forEach((question, index) => {
        partBHTML += `
              <div class="question">
            <div class="question-number">${index + 1}.</div>
            <div class="question-content">
                <div class="question-text">${question.text}</div>
                    </div>
            <div class="marking-grid">
              <div class="marking-cell">${question.marks || 8}</div>
                </div>
              </div>
            `;
      });
    }

    // Generate Part C questions (all long questions)
    let partCHTML = '';
    if (partC.length > 0) {
      partC.forEach((question, index) => {
        partCHTML += `
              <div class="question">
            <div class="question-number">${index + 1}.</div>
            <div class="question-content">
                <div class="question-text">${question.text}</div>
              </div>
            <div class="marking-grid">
              <div class="marking-cell">${question.marks || 10}</div>
                </div>
              </div>
            `;
      });
    } else {
      // Default Part C question if no long question available
      partCHTML = `
              <div class="question">
          <div class="question-number">1.</div>
          <div class="question-content">
            <div class="question-text">Explain in detail the main concepts covered in this subject with relevant examples and applications.</div>
          </div>
          <div class="marking-grid">
            <div class="marking-cell">10</div>
                </div>
              </div>
            `;
          }
          
    // Create registration number boxes
    let regBoxesHTML = '';
    for (let i = 0; i < 15; i++) {
      regBoxesHTML += `<div class="reg-box"></div>`;
    }

    // Set up the exam title information
    const examLevel = educationalLevel || "Examination";
    const paperTitle = title ? title : "Question Paper";
    const subjectCode = title ? title : "Question Paper";
    const subjectName = subject ? subject.toUpperCase() : "";
    const topicName = topic || "";
    const maxMarks = totalMarks || 75;
    const examDuration = duration ? `${duration} minutes` : "180 minutes";
    const currentYear = new Date().getFullYear();
    
    // Calculate total marks for each part
    const partATotal = partA.length * (partA.length > 0 ? (partA[0].marks || 1) : 1);
    
    // Fix mark calculations for Part B and C to use actual question data
    let partBMarksPerQuestion = 0;
    if (partB.length > 0) {
      // Use the marks value from the first question, or default to 8
      partBMarksPerQuestion = partB[0].marks || 8;
    } else {
      partBMarksPerQuestion = 8; // Default value
    }
    const partBTotal = partB.length * partBMarksPerQuestion;
    
    let partCMarksPerQuestion = 0;
    if (partC.length > 0) {
      // Use the marks value from the first question, or default to 10
      partCMarksPerQuestion = partC[0].marks || 10;
    } else {
      partCMarksPerQuestion = 10; // Default value
    }
    const partCTotal = partC.length * partCMarksPerQuestion;
    
    // Build the complete HTML template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8">
      <title>${title || 'Question Paper'}</title>
        <style>
        @page {
          size: A4;
          margin: 15mm;
        }
          body {
          font-family: 'Times New Roman', Times, serif;
          margin: 0;
          padding: 0;
          color: #000;
          font-size: 11pt;
          line-height: 1.3;
        }
        .page-container {
          position: relative;
          width: 100%;
          box-sizing: border-box;
          padding: 0;
          margin: 0;
          }
          .header {
            text-align: center;
          margin-bottom: 8pt;
        }
        .reg-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 10pt;
        }
        .reg-label {
          font-weight: bold;
          margin-right: 5pt;
        }
        .reg-boxes {
          display: flex;
        }
        .reg-box {
          width: 15pt;
          height: 15pt;
          border: 1pt solid #000;
          margin-right: 2pt;
        }
        .exam-title {
          font-weight: bold;
          font-size: 12pt;
          margin: 8pt 0 5pt;
        }
        .semester {
          font-size: 11pt;
          margin: 5pt 0;
        }
        .subject-code {
          font-weight: bold;
          font-size: 12pt;
          margin: 5pt 0;
        }
        .admission-period {
          font-size: 10pt;
          margin: 5pt 0;
          font-style: italic;
        }
        .note-section {
          margin: 15pt 0;
          font-size: 10pt;
        }
        .note-title {
            font-weight: bold;
          }
        .note-item {
          margin: 3pt 0;
          }
        .time-marks-row {
            display: flex;
            justify-content: space-between;
          margin: 15pt 0;
          font-weight: bold;
        }
        .part-header {
          font-weight: bold;
          text-align: center;
          margin: 0;
          padding: 5pt 0 3pt;
          border-bottom: 1pt solid #000;
        }
        .marking-column-header {
          text-align: right;
          font-size: 9pt;
          margin-bottom: 5pt;
        }
        .instruction {
          margin: 5pt 0 10pt;
          }
          .question {
          margin-bottom: 6pt;
          position: relative;
            display: flex;
          }
          .question-number {
          width: 20pt;
            font-weight: bold;
        }
        .question-content {
          flex: 1;
          }
          .question-text {
          margin-bottom: 5pt;
        }
        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 10pt;
          row-gap: 3pt;
          border-top: 0.5pt solid #eee;
          padding-top: 3pt;
        }
        .marking-grid {
          width: 40pt;
          text-align: center;
        }
        .marking-cell {
          width: 30pt;
          text-align: center;
            font-weight: bold;
        }
        .questions-container {
          margin-bottom: 5pt;
          }
        </style>
      </head>
      <body>
      <!-- Complete continuous document with forced page breaks -->
      <div class="page-container">
        <div class="header">
          <div class="reg-container">
            <div class="reg-label">Reg. No.</div>
            <div class="reg-boxes">
              ${regBoxesHTML}
            </div>
          </div>
          
          <div class="exam-title">${examLevel} ${educationBoard ? educationBoard : ''} Examination, ${currentYear}</div>
          <div class="subject-code">${paperTitle}</div>
          ${topicName ? `<div class="semester">Topic: ${topicName}</div>` : ''}
        </div>
        
        <div class="note-section">
          <div class="note-title">Note:</div>
          <div class="note-item">(i) Part - A should be answered in OMR sheet within first 40 minutes and OMR sheet should be handed over to hall invigilator at the end of 40th minute.</div>
          <div class="note-item">(ii) Part - B & Part - C should be answered in answer booklet.</div>
        </div>
        
        <div class="time-marks-row">
          <div>Time: ${examDuration}</div>
          <div>Max. Marks: ${maxMarks}</div>
        </div>
        
        <div class="part-header">PART - A (${partA.length} × ${partA.length > 0 ? (partA[0].marks || 1) : 1} = ${partATotal} Marks)</div>
        
        <div class="marking-column-header">
          <span>Marks</span>
        </div>
        
        <div class="instruction">Answer ALL Questions</div>
        
        <div class="questions-container">
          ${partAHTML}
        </div>
        
        <!-- Hard page break -->
        <div style="page-break-after: always; padding: 0; margin: 0; height: 0;"></div>
        
        <div class="part-header">PART - B (${partB.length} × ${partBMarksPerQuestion} = ${partBTotal} Marks)</div>
        
        <div class="marking-column-header">
          <span>Marks</span>
        </div>
        
        <div class="instruction">Answer ALL Questions</div>
        
        <div class="questions-container">
          ${partBHTML}
        </div>
        
        <div class="part-header" style="margin-top: 0;">PART - C (${partC.length} × ${partCMarksPerQuestion} = ${partCTotal} Marks)</div>
        
        <div class="marking-column-header">
          <span>Marks</span>
        </div>
        
        <div class="instruction">Answer the following question${partC.length > 1 ? 's' : ''}</div>
        
        <div class="questions-container">
          ${partCHTML}
        </div>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Generate a PDF from a question paper
   * @param {Object} questionPaper - The question paper object
   * @returns {Promise<Buffer>} - The PDF as a buffer
   */
  async generatePDF(questionPaper) {
    try {
      const html = this.generateHTML(questionPaper);
      
      // Launch a browser instance
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set content to our HTML
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF as buffer instead of saving to file
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });
      
      // Close the browser
      await browser.close();
      
      logger.info(`PDF generated successfully in memory`);
      return pdfBuffer;
    } catch (error) {
      logger.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}

module.exports = new PDFService(); 