const PDFDocument = require('pdfkit');
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
    return new Promise((resolve, reject) => {
      try {
        // Create a PDF document with A4 size
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 40,
            bottom: 40,
            left: 50,
            right: 50
          },
          info: {
            Title: questionPaper.title || 'Question Paper',
            Author: 'Ignitia',
            Subject: questionPaper.subject || 'Examination'
          },
          autoFirstPage: true
        });

        // Create a buffer to store the PDF
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          logger.info('PDF generated successfully in memory');
          resolve(pdfBuffer);
        });
        
        // Helper function to replace mathematical symbols in text
        const formatMathText = (text) => {
          if (!text) return '';
          
          // Replace common mathematical symbols
          return text
            .replace(/(\d+)π/g, '$1π') // Ensure π is preserved with numbers
            .replace(/(\d+)<([^\s>]+)/g, (match, p1, p2) => {
              // Check if this looks like it should be pi (π)
              if (p2 === '' || /^\s/.test(p2)) {
                return `${p1}π`;
              }
              return match;
            })
            .replace(/([^<])<([^<\s>]+)/g, (match, p1, p2) => {
              // Check if this looks like it should be pi (π)
              if (p2 === '' || /^\s/.test(p2)) {
                return `${p1}π`;
              }
              return match;
            });
        };

        // Extract question paper data
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
        
        // Organize questions by parts
        const partA = questionsByType['mcq'] || [];
        const partB = [];
        
        // Part B includes short, diagram, and code questions
        ['short', 'diagram', 'code', 'case_study'].forEach(type => {
          if (questionsByType[type]) {
            partB.push(...questionsByType[type]);
          }
        });
        
        // Part C includes long questions
        const partC = questionsByType['long'] || [];
        
        // Part D includes HOTS (Higher Order Thinking Skills) questions
        const partD = questionsByType['hots'] || [];

        // Set up the exam title information
        const examLevel = educationalLevel || "Examination";
        const examClass = className || "10";
        const paperTitle = subject ? `${subject} - Final Exam` : "Question Paper";
        const subjectName = subject ? subject.toUpperCase() : "";
        const topicName = topic || "";
        const maxMarks = totalMarks || 80;
        const examDuration = duration ? `${duration} minutes` : "180 minutes";
        const currentYear = new Date().getFullYear();
        
        // Calculate marks for each part
        // Part A (MCQs)
        const partAMarksPerQuestion = partA.length > 0 ? (partA[0].marks || 1) : 1;
        const partATotal = partA.length * partAMarksPerQuestion;
        
        // Part B (Short, diagram, code questions)
        const partBMarksPerQuestion = partB.length > 0 ? (partB[0].marks || 8) : 8;
        const partBTotal = partB.length * partBMarksPerQuestion;
        
        // Part C (Long questions)
        const partCMarksPerQuestion = partC.length > 0 ? (partC[0].marks || 10) : 10;
        const partCTotal = partC.length * partCMarksPerQuestion;
        
        // Part D (HOTS questions)
        const partDMarksPerQuestion = partD.length > 0 ? (partD[0].marks || 8) : 8;
        const partDTotal = partD.length * partDMarksPerQuestion;

        //-------------------
        // HEADER SECTION
        //-------------------
        
        // Center align for header
        doc.fontSize(12).font('Times-Bold').text('Reg. No.', {align: 'center'});
        
        // Registration boxes
        const regBoxWidth = 15;
        const regBoxHeight = 15;
        const regBoxCount = 15;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const totalBoxWidth = regBoxCount * regBoxWidth;
        const startX = (pageWidth - totalBoxWidth) / 2 + doc.page.margins.left;
        
        // Draw registration boxes
        doc.moveDown(0.2);
        const boxY = doc.y;
        for (let i = 0; i < regBoxCount; i++) {
          doc.rect(startX + (i * regBoxWidth), boxY, regBoxWidth, regBoxHeight).stroke();
        }
        
        doc.moveDown(1.5);
        
        // Exam title
        doc.fontSize(12).font('Times-Bold').text(`Class ${examClass} Examination, ${currentYear}`, {align: 'center'});
        doc.moveDown(0.5);
        
        doc.text(paperTitle, {align: 'center'});
        doc.moveDown(0.5);
        
        if (topicName) {
          doc.fontSize(11).text(`Topic: ${topicName}`, {align: 'center'});
          doc.moveDown(0.5);
        }
        
        // Notes section
        doc.moveDown();
        doc.fontSize(10).font('Times-Bold').text('Note:');
        doc.font('Times-Roman').text('(i) Part - A should be answered in OMR sheet within first 40 minutes and OMR sheet should be handed over to hall invigilator at the end of 40th minute.');
        doc.text('(ii) Part - B, Part - C & Part - D should be answered in answer booklet.');
        doc.moveDown();
        
        // Time and marks
        doc.fontSize(11).font('Times-Bold');
        doc.text(`Time: ${examDuration}`, {continued: true});
        doc.text(`Max. Marks: ${maxMarks}`, {align: 'right'});
        doc.moveDown();

        //-------------------
        // PART A - MCQs
        //-------------------
        
        if (partA.length > 0) {
          doc.fontSize(12).font('Times-Bold');
          doc.text(`PART - A (${partA.length} × ${partAMarksPerQuestion} = ${partATotal} Marks)`, {align: 'center'});
          
          // Draw a line
          doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).stroke();
          doc.moveDown(0.5);
          
          // Marks column header - align right
          doc.text('Marks', {align: 'right'});
          doc.moveDown(0.5);
          
          // Instruction
          doc.text('Answer ALL Questions');
          doc.moveDown();
          
          // Part A Questions (MCQs)
          doc.fontSize(11).font('Times-Roman');
          
          partA.forEach((question, index) => {
            // Start with question number and text
            const questionY = doc.y;
            doc.font('Times-Bold').text(`${index + 1}.`, 50, questionY);
            
            // Format question text to handle math symbols
            const formattedText = formatMathText(question.text);
            doc.font('Times-Roman').text(formattedText, 70, questionY, {width: 400});
            
            // Marks on the right
            doc.font('Times-Bold').text(`${partAMarksPerQuestion}`, doc.page.width - 70, questionY, {align: 'center'});
            
            doc.moveDown(0.5);
            
            // Options in a grid - improved layout for better alignment
            const options = question.options || ['Option A', 'Option B', 'Option C', 'Option D'];
            const optionLabels = ['A)', 'B)', 'C)', 'D)'];
            
            // Calculate positions for a 2x2 grid
            const optionStartY = doc.y;
            const optionWidth = 230; // Width for each option
            const optionHeight = 20; // Height for each option
            const labelWidth = 20; // Width for option label (A, B, C, D)
            
            // Draw the options in 2x2 grid with proper alignment
            for (let i = 0; i < 4; i++) {
              const row = Math.floor(i / 2);
              const col = i % 2;
              const optionX = 80 + (col * optionWidth);
              const optionY = optionStartY + (row * optionHeight);
              
              // Draw option label (A, B, C, D)
              doc.font('Times-Bold').text(optionLabels[i], optionX, optionY);
              
              // Format option text to handle math symbols
              const formattedOption = formatMathText(options[i] || `Option ${i+1}`);
              
              // Draw option text
              doc.font('Times-Roman').text(formattedOption, optionX + labelWidth, optionY, {
                width: optionWidth - labelWidth - 10
              });
            }
            
            // Move down after options
            doc.moveDown(2.5);
            
            // Check for page break if needed
            if (doc.y > doc.page.height - 100) {
              doc.addPage();
            }
          });
          
          // Add a page break after Part A
          doc.addPage();
        }
        
        //-------------------
        // PART B
        //-------------------
        
        if (partB.length > 0) {
          doc.fontSize(12).font('Times-Bold');
          doc.text(`PART - B (${partB.length} × ${partBMarksPerQuestion} = ${partBTotal} Marks)`, {align: 'center'});
          
          // Draw a line
          doc.moveTo(50, doc.y + 3).lineTo(doc.page.width - 50, doc.y + 3).stroke();
          doc.moveDown(0.5);
          
          // Marks column header
          doc.text('Marks', {align: 'right'});
          doc.moveDown(0.5);
          
          // Instruction
          doc.text('Answer ALL Questions');
          doc.moveDown();
          
          // Part B Questions
          doc.fontSize(11).font('Times-Roman');
          partB.forEach((question, index) => {
            // Question number and text
            const questionY = doc.y;
            doc.font('Times-Bold').text(`${index + 1}.`, 50, questionY);
            
            // Format question text to handle math symbols
            const formattedText = formatMathText(question.text);
            doc.font('Times-Roman').text(formattedText, 70, questionY, {width: 400});
            
            // Marks on the right
            doc.font('Times-Bold').text(`${partBMarksPerQuestion}`, doc.page.width - 70, questionY, {align: 'center'});
            
            // Move down after the question
            doc.moveDown(2);
            
            // Check for page break if needed
            if (doc.y > doc.page.height - 100) {
              doc.addPage();
            }
          });
          
          // Add spacing between sections if needed
          if (doc.y > doc.page.height - 200 && (partC.length > 0 || partD.length > 0)) {
            doc.addPage();
          } else {
            doc.moveDown(2);
          }
        }
        
        //-------------------
        // PART C - COMPLETELY REWRITTEN
        //-------------------
        
        if (partC.length > 0) {
          // Explicitly add a new page to fix layout issues with Part C
          doc.addPage();
          
          // Reset position to top of page
          const initialY = 60;
          
          // First draw the title manually with specific positioning
          doc.fontSize(12).font('Times-Bold');
          const partCTitle = `PART - C (${partC.length} × ${partCMarksPerQuestion} = ${partCTotal} Marks)`;
          
          // Calculate centered position
          const titleWidth = doc.widthOfString(partCTitle);
          const titleX = ((doc.page.width - doc.page.margins.left - doc.page.margins.right) - titleWidth) / 2 + doc.page.margins.left;
          
          // Draw title with absolute positioning
          doc.text(partCTitle, titleX, initialY, {
            lineBreak: false
          });
          
          // Draw a line under the header
          doc.moveTo(50, initialY + 20).lineTo(doc.page.width - 50, initialY + 20).stroke();
          
          // Draw "Marks" header at specific position
          doc.text('Marks', doc.page.width - 70, initialY + 30, {
            width: 50,
            align: 'center'
          });
          
          // Draw instruction at specific position
          doc.text(`Answer the following question${partC.length > 1 ? 's' : ''}`, 50, initialY + 30);
          
          // Position to start drawing questions
          let qY = initialY + 60;
          
          // Draw Part C questions
          partC.forEach((question, index) => {
            // Question number
            doc.font('Times-Bold').text(`${index + 1}.`, 50, qY);
            
            // Format and draw question text
            const formattedText = formatMathText(question.text);
            doc.font('Times-Roman').text(formattedText, 70, qY, {
              width: 400
            });
            
            // Draw marks
            doc.font('Times-Bold').text(`${partCMarksPerQuestion}`, doc.page.width - 70, qY, {
              align: 'center'
            });
            
            // Space between questions
            qY += 50;
            
            // Check if we need a page break
            if (qY > doc.page.height - 100) {
              doc.addPage();
              qY = 60; // Reset Y position on new page
            }
          });
          
          // If Part D is next, don't add extra space - pass final Y position instead
          // Set doc.y to the last used position to connect parts properly
          doc.y = qY;
        }
        
        //-------------------
        // PART D - HOTS Questions
        //-------------------
        
        if (partD.length > 0) {
          // Only add a new page if we're close to the bottom
          if (doc.y > doc.page.height - 150) {
            doc.addPage();
            doc.y = 60; // Reset position on new page
          } else if (partC.length > 0) {
            // Add only minimal spacing between parts if Part C exists
            doc.moveDown(1);
          }
          
          // Get current position
          const initialY = doc.y;
          
          // Draw the Part D header
          doc.fontSize(12).font('Times-Bold');
          const partDTitle = `PART - D (${partD.length} × ${partDMarksPerQuestion} = ${partDTotal} Marks)`;
          
          // Calculate centered position
          const titleWidth = doc.widthOfString(partDTitle);
          const titleX = ((doc.page.width - doc.page.margins.left - doc.page.margins.right) - titleWidth) / 2 + doc.page.margins.left;
          
          // Draw title with absolute positioning
          doc.text(partDTitle, titleX, initialY, {
            lineBreak: false
          });
          
          // Draw a line under the header
          doc.moveTo(50, initialY + 20).lineTo(doc.page.width - 50, initialY + 20).stroke();
          
          // Draw "Marks" header
          doc.text('Marks', doc.page.width - 70, initialY + 30, {
            width: 50,
            align: 'center'
          });
          
          // Draw instruction
          doc.text('Answer ALL Questions (Higher Order Thinking Skills)', 50, initialY + 30);
          
          // Position to start drawing questions
          let qY = initialY + 60;
          
          // Draw Part D questions
          partD.forEach((question, index) => {
            // Question number
            doc.font('Times-Bold').text(`${index + 1}.`, 50, qY);
            
            // Format and draw question text
            const formattedText = formatMathText(question.text);
            doc.font('Times-Roman').text(formattedText, 70, qY, {
              width: 400
            });
            
            // Draw marks
            doc.font('Times-Bold').text(`${partDMarksPerQuestion}`, doc.page.width - 70, qY, {
              align: 'center'
            });
            
            // Space between questions - slightly reduced
            qY += 40;
            
            // Check if we need a page break
            if (qY > doc.page.height - 100 && index < partD.length - 1) {
              doc.addPage();
              qY = 60; // Reset Y position on new page
            }
          });
        }
        
        // Finalize the PDF
        doc.end();
        
      } catch (error) {
        logger.error('PDF generation error:', error);
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    });
  }
}

module.exports = new PDFService(); 
