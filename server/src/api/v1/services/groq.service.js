const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');
const logger = require('../../../utils/logger');

// Load environment variables
dotenv.config();

// Available Groq Models:
// - llama3-70b-8192 (recommended for best quality)
// - llama3-8b-8192 (faster, smaller model)
// - mixtral-8x7b-32768 (good for longer contexts)
// - gemma-7b-it (balanced performance)
const DEFAULT_MODEL = 'llama3-70b-8192';

// Initialize Groq API client with API key
const apiKey = process.env.GROQ_API_KEY;

// Create the client with the API key
client = new Groq({ apiKey });
console.log('Groq API client initialized with API key');

class GroqService {
  /**
   * Generate questions using Groq API
   */
  async generateQuestions(topic, count, difficulty, type, bloomsLevel, subject, model, additionalParams = {}) {
    try {
      // Prepare prompt
      const params = {
        topic,
        count,
        difficulty,
        type,
        bloomsLevel,
        subject,
        ...additionalParams,
      };
      
      const prompt = this.createPrompt(params);
      
      // Make API call to Groq
      const result = await client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
      });
      
      // Extract questions from response
      const responseText = result.choices[0].message.content || "";
      
      try {
        // Clean the response text to improve JSON extraction
        const cleanedResponseText = this.cleanJsonResponse(responseText);
        
        // Try to find JSON object in the response
        const jsonMatch = cleanedResponseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : "";
        
        // Enhanced error handling for JSON parsing
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(jsonStr);
          console.log("Successfully parsed JSON on first attempt");
        } catch (parseError) {
          console.error("JSON Parse error:", parseError.message);
          
          // Try to fix common JSON issues
          let fixedJsonStr = jsonStr
            // Fix common escape character issues
            .replace(/\\(?!["\\/bfnrt])/g, '\\\\')
            // Fix unescaped quotes within strings
            .replace(/(?<=\":\"[^\"]*)\"(?=[^\"]*\")/g, '\\"')
            // Handle any trailing commas
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            // Fix invalid control characters
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            // Fix potential line breaks in strings
            .replace(/(?<="[^"]*)[\n\r]+(?=[^"]*")/g, ' ');
            
          try {
            parsedResponse = JSON.parse(fixedJsonStr);
            console.log("Successfully parsed JSON after fixing formatting issues");
          } catch (secondParseError) {
            console.error("Failed second parse attempt:", secondParseError.message);
            
            // As a last resort, try different regex patterns
            try {
              // Try to extract just the questions array
              const questionsMatch = cleanedResponseText.match(/\"questions\"\s*:\s*\[([\s\S]*?)\](?=\s*\})/);
              
              if (questionsMatch) {
                // Try to parse just the questions array with added brackets
                const questionsJson = `{"questions":[${questionsMatch[1]}]}`;
                parsedResponse = JSON.parse(questionsJson);
                console.log("Successfully extracted questions via pattern matching");
              } else {
                // Try another approach - find any array in the response
                const arrayMatch = cleanedResponseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (arrayMatch) {
                  const arrayStr = arrayMatch[0];
                  parsedResponse = { questions: JSON.parse(arrayStr) };
                  console.log("Successfully extracted questions array directly");
                } else {
                  throw new Error("Could not locate questions in the response");
                }
              }
            } catch (finalAttemptError) {
              console.error("All parsing attempts failed:", finalAttemptError.message);
              console.error("Response text:", responseText.substring(0, 200) + "...");
              throw new Error("Failed to parse response from AI model after multiple attempts");
            }
          }
        }
        
        if (parsedResponse && parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
          // Process and validate questions
          const processedQuestions = this.processQuestions(parsedResponse.questions, topic);
          
          // Ensure we have the exact number of questions as requested in the distribution
          if (params.questionDistribution && params.questionDistribution.length > 0) {
            return this.ensureQuestionCount(processedQuestions, params.questionDistribution, topic, subject);
          }
          
          return processedQuestions;
        } else {
          console.error("Invalid response format - missing questions array:", parsedResponse);
          throw new Error("Invalid response format from Groq API - missing questions array");
        }
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Failed to parse response from AI model");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      
      // Check if we should use the mock response
      if (this.useMockResponse) {
        console.log("Using mock response for question generation");
        return this.getMockQuestions(topic, count, type, difficulty);
      }
      
      throw error;
    }
  }
  
  /**
   * Clean JSON response to improve parsing success
   */
  cleanJsonResponse(responseText) {
    // First, try to extract just the JSON part
    // Look for patterns like ```json or ```javascript followed by JSON content
    const codeBlockMatch = responseText.match(/```(?:json|javascript)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code block, try to clean up the response
    let cleaned = responseText
      // Remove any markdown formatting
      .replace(/\*\*/g, '')
      // Remove line breaks in strings
      .replace(/(?<="[^"]*)[\n\r]+(?=[^"]*")/g, ' ')
      // Replace multiple spaces with a single space
      .replace(/\s+/g, ' ')
      // Remove any text before the first {
      .replace(/^[^{]*/, '')
      // Remove any text after the last }
      .replace(/}[^}]*$/, '}');
    
    return cleaned;
  }
  
  /**
   * Process and validate questions
   */
  processQuestions(questions, topic) {
    return questions.map(question => {
      // Ensure required fields are present
      const processedQuestion = {
        text: question.text || "No question text provided",
        type: question.type || "mcq",
        difficulty: question.difficulty || "medium",
        marks: question.marks || this.getDefaultMarks(question.type, question.difficulty),
        topic: question.topic || topic,
        bloomsTaxonomy: question.bloomsTaxonomy || undefined,
        explanation: question.explanation || undefined
      };
      
      // Validate MCQ questions have exactly 4 options
      if (processedQuestion.type === "mcq") {
        processedQuestion.options = this.validateMCQOptions(question.options);
        
        // Ensure correct answer is set and is one of the options
        if (question.correctAnswer && processedQuestion.options.includes(question.correctAnswer)) {
          processedQuestion.correctAnswer = question.correctAnswer;
        } else {
          // Default to first option if no valid correct answer provided
          processedQuestion.correctAnswer = processedQuestion.options[0];
        }
      }
      
      return processedQuestion;
    });
  }
  
  /**
   * Validate MCQ options and ensure exactly 4 options
   */
  validateMCQOptions(options) {
    // If options is not an array or has fewer than 4 options
    if (!options || !Array.isArray(options) || options.length < 4) {
      console.warn('MCQ question has fewer than 4 options, adding generic options');
      
      // Create a standardized set of 4 options
      const validOptions = Array.isArray(options) ? [...options] : [];
      
      // Fill with generic options if needed
      while (validOptions.length < 4) {
        validOptions.push(`Option ${String.fromCharCode(65 + validOptions.length)}`);
      }
      
      return validOptions.slice(0, 4); // Ensure exactly 4
    }
    
    // If more than 4 options, truncate to 4
    if (options.length > 4) {
      console.warn('MCQ question has more than 4 options, truncating to 4');
      return options.slice(0, 4);
    }
    
    // Exactly 4 options, return as is
    return options;
  }
  
  /**
   * Get default marks based on question type and difficulty
   */
  getDefaultMarks(type, difficulty) {
    const difficultyMultiplier = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    };
    
    const baseMarks = {
      mcq: 2,
      short: 4,
      long: 8,
      diagram: 6,
      code: 7,
      hots: 10,
      case_study: 12,
    };
    
    return Math.round(baseMarks[type] * (difficultyMultiplier[difficulty] || 1));
  }

  /**
   * Create a prompt for the AI based on the parameters
   */
  createPrompt(params) {
    const { 
      topic, 
      count,
      difficulty,
      type,
      bloomsLevel, 
      subject, 
      description, 
      syllabus, 
      totalMarks, 
      duration,
      questionTypes = [type],
      questionDistribution = [],
      educationalLevel
    } = params;
    
    // Start with basic prompt
    let prompt = `Generate ${count} high-quality, meaningful, educational questions on ${topic}`;
    
    if (subject) {
      prompt += ` for the subject ${subject}`;
    }
    
    // Add educational level if provided
    if (educationalLevel) {
      prompt += ` appropriate for ${educationalLevel} level students`;
    }
    
    // Add question paper context if available
    if (description) {
      prompt += `\n\nPaper description: "${description}"`;
    }
    
    if (syllabus) {
      prompt += `\n\nSyllabus: "${syllabus}"`;
    }
    
    if (totalMarks) {
      prompt += `\n\nThis is for a ${totalMarks} mark exam`;
    }
    
    if (duration) {
      prompt += ` with a duration of ${duration} minutes`;
    }
    
    // Add critical instructions for quality
    prompt += `\n\n=== CRITICAL CONTENT REQUIREMENTS ===`;
    prompt += `\n1. All questions MUST be well-formed and appropriate for academic assessment.`;
    prompt += `\n2. Questions MUST be meaningful and contain actual subject matter content.`;
    prompt += `\n3. Never generate generic placeholders like "Additional question on this topic."`;
    prompt += `\n4. Each question should be precisely worded and unambiguous.`;
    prompt += `\n5. IMPORTANT: Do NOT mention the topic directly in the question text. Create natural questions that test the topic without explicitly naming it.`;
    
    // Subject-specific requirements
    if (subject) {
      prompt += `\n6. All questions must accurately represent ${subject} concepts and terminology.`;
      
      // Add subject-specific instructions
      if (subject.toLowerCase().includes('math')) {
        prompt += `\n7. For mathematics questions:`;
        prompt += `\n   a. Include specific numerical values, equations, or mathematical concepts in each question.`;
        prompt += `\n   b. MCQ options for math questions must contain plausible numerical answers or mathematical expressions.`;
        prompt += `\n   c. Ensure all mathematical formulas are correct and properly formatted.`;
        prompt += `\n   d. For questions involving calculations, make sure the calculations are reasonable for the time constraints.`;
        prompt += `\n   e. Cover different areas of mathematics such as algebra, geometry, calculus, statistics, etc. as appropriate for the topic.`;
        prompt += `\n   f. Include questions that test conceptual understanding, not just computational skills.`;
      } 
      else if (subject.toLowerCase().includes('physics') || subject.toLowerCase().includes('chemistry')) {
        prompt += `\n7. For ${subject} questions:`;
        prompt += `\n   a. Include precise scientific terminology and concepts.`;
        prompt += `\n   b. Reference appropriate scientific laws, theories, and principles.`;
        prompt += `\n   c. For numeric problems, include appropriate units and reasonable values.`;
        prompt += `\n   d. Balance theoretical concepts with practical applications.`;
        prompt += `\n   e. For chemistry, include appropriate chemical formulas, reactions, and nomenclature when relevant.`;
        prompt += `\n   f. For physics, include relevant equations and ensure physical quantities have correct dimensions.`;
      }
      else if (subject.toLowerCase().includes('computer') || subject.toLowerCase().includes('programming')) {
        prompt += `\n7. For computer science questions:`;
        prompt += `\n   a. Use proper programming syntax and conventions if code is involved.`;
        prompt += `\n   b. Reference appropriate computing concepts, algorithms, or data structures.`;
        prompt += `\n   c. Balance theoretical computer science with practical programming topics.`;
        prompt += `\n   d. Include questions on problem-solving approaches in computing.`;
        prompt += `\n   e. Consider both software and hardware aspects as appropriate to the topic.`;
      }
      else if (subject.toLowerCase().includes('biology') || subject.toLowerCase().includes('life science')) {
        prompt += `\n7. For biology questions:`;
        prompt += `\n   a. Include precise biological terminology and concepts.`;
        prompt += `\n   b. Cover different biological systems, processes, or hierarchies as appropriate.`;
        prompt += `\n   c. Connect theoretical biological concepts to real-world examples.`;
        prompt += `\n   d. Include questions that test understanding of biological mechanisms and processes.`;
        prompt += `\n   e. Balance questions across different areas like anatomy, physiology, genetics, ecology, etc.`;
      }
      else if (subject.toLowerCase().includes('history') || subject.toLowerCase().includes('social')) {
        prompt += `\n7. For history/social studies questions:`;
        prompt += `\n   a. Include accurate historical facts, events, dates, and figures.`;
        prompt += `\n   b. Frame questions that test causal relationships and historical significance.`;
        prompt += `\n   c. Balance factual recall with analytical and interpretive questions.`;
        prompt += `\n   d. Include questions that consider multiple historical perspectives.`;
        prompt += `\n   e. Test understanding of historical contexts and their implications.`;
      }
      else if (subject.toLowerCase().includes('language') || subject.toLowerCase().includes('literature') || subject.toLowerCase().includes('english')) {
        prompt += `\n7. For language and literature questions:`;
        prompt += `\n   a. Include questions on grammar, vocabulary, comprehension, and analysis.`;
        prompt += `\n   b. For literature, reference appropriate literary works, authors, and concepts.`;
        prompt += `\n   c. Balance questions on literary devices, themes, characters, and contexts.`;
        prompt += `\n   d. Include questions that test both textual understanding and critical analysis.`;
        prompt += `\n   e. For language questions, test both language usage and understanding of linguistic concepts.`;
      }
      else {
        prompt += `\n7. For ${subject} questions:`;
        prompt += `\n   a. Include domain-specific terminology and concepts relevant to the field.`;
        prompt += `\n   b. Balance factual knowledge with analytical and application-based questions.`;
        prompt += `\n   c. Include questions that test both foundational knowledge and deeper understanding.`;
        prompt += `\n   d. Connect theoretical concepts to practical or real-world applications where appropriate.`;
        prompt += `\n   e. Include a range of question types to test different cognitive skills within the subject.`;
      }
    }
    
    // Syllabus alignment
    if (syllabus) {
      prompt += `\n8. STRICTLY adhere to the provided syllabus content.`;
      prompt += `\n9. Questions should only cover topics mentioned in the syllabus.`;
    }
    
    // Educational level appropriateness
    if (educationalLevel) {
      prompt += `\n10. Ensure questions are at an appropriate difficulty for ${educationalLevel} level.`;
    }
    
    // Question type specific instructions
    prompt += `\n11. For MCQ questions: Provide exactly 4 options with one correct answer. All options should be plausible.`;
    prompt += `\n12. For short answer questions: Create concise, focused questions requiring brief explanations.`;
    prompt += `\n13. For long answer questions: Design questions that test deep understanding and analytical skills.`;
    prompt += `\n14. Group similar question types together in the generated output.`;
    
    prompt += `\n=== END OF CONTENT REQUIREMENTS ===\n`;
    
    // If we have a detailed question distribution, use it
    if (questionDistribution && questionDistribution.length > 0) {
      prompt += `\n\n=== CRITICAL DISTRIBUTION AND MARKS REQUIREMENTS ===`;
      prompt += `\nCreate EXACTLY these questions with the EXACT marks specified:`;
      
      questionDistribution.forEach(item => {
        const marksInstruction = item.marks ? ` with EXACTLY ${item.marks} marks per question` : '';
        prompt += `\n- ${item.count} ${item.difficulty} ${item.type} questions${marksInstruction}`;
      });
      
      // Calculate total count
      const totalQuestions = questionDistribution.reduce((sum, item) => sum + item.count, 0);
      prompt += `\n\nTotal number of questions: ${totalQuestions}`;
      
      // Add explicit instruction about marks
      if (questionDistribution.some(item => item.marks)) {
        prompt += `\n\nIMPORTANT: The marks for each question type are fixed and non-negotiable:`;
        questionDistribution.forEach(item => {
          if (item.marks) {
            prompt += `\n- ALL ${item.type} questions with "${item.difficulty}" difficulty MUST be worth EXACTLY ${item.marks} marks each.`;
          }
        });
      }
      
      prompt += `\n=== END OF DISTRIBUTION REQUIREMENTS ===\n`;
    } 
    // Otherwise fall back to the older style
    else if (questionTypes.length > 1) {
      prompt += `\n\nDistribute the questions among these types: ${questionTypes.join(', ')}. Approximately ${Math.ceil(count / questionTypes.length)} questions per type.`;
    } else {
      prompt += `. Questions should be of type "${type}".`;
    }
    
    if (bloomsLevel) {
      prompt += ` Questions should target the "${bloomsLevel}" level of Bloom's Taxonomy.`;
    }
    
    // Definitions for question types
    prompt += "\n\nSpecifications for each question type:";
    prompt += "\n- mcq: Multiple choice questions with EXACTLY 4 options (labeled A, B, C, D) and exactly one correct answer. Every MCQ must have all 4 options defined.";
    prompt += "\n- short: Short answer questions requiring brief explanations or definitions (a few sentences).";
    prompt += "\n- long: Long answer questions requiring detailed explanations, analysis, or discussion.";
    prompt += "\n- diagram: Questions asking students to explain visual representations or describe diagrams.";
    prompt += "\n- code: Questions involving writing, analyzing, or debugging code snippets.";
    prompt += "\n- hots: Higher Order Thinking Skill questions that require critical thinking, analysis, and problem-solving.";
    prompt += "\n- case_study: Questions based on a scenario or case that requires analysis and application of knowledge.";
    
    // Difficulty level expectations
    prompt += `\n\nDifficulty level expectations:`;
    prompt += `\n- Easy: Questions testing basic understanding and recall of fundamental concepts.`;
    prompt += `\n- Medium: Questions testing application of concepts and requiring some analysis.`;
    prompt += `\n- Hard: Questions requiring deep understanding, critical thinking, and synthesis of multiple concepts.`;
    
    // Assign appropriate marks based on question type and difficulty
    prompt += `\n\nAssign appropriate marks to each question:`;
    prompt += `\n- Easy questions: 2-5 marks`;
    prompt += `\n- Medium questions: 5-8 marks`;
    prompt += `\n- Hard questions: 8-15 marks`;
    prompt += `\n- MCQs: 1-3 marks each`;
    prompt += `\n- Short questions: 3-6 marks each`;
    prompt += `\n- Long questions: 6-15 marks each`;
    prompt += `\n- HOTS and Case Study questions: 8-15 marks each`;
    
    // Add response format instructions
    prompt += `\n\nIMPORTANT: If you cannot generate a proper, meaningful question for any reason, DO NOT create a placeholder question. Instead, create a different question that is still within the requirements.`;
    
    // Mathematics-specific examples if needed
    if (subject) {
      prompt += `\n\nExamples of good ${subject} questions:\n`;
      
      if (subject.toLowerCase().includes('math')) {
        prompt += `1. MCQ: "If the roots of the quadratic equation x² + bx + c = 0 are 3 and -5, what is the value of b + c?" Options: ["2", "-2", "8", "-15"]\n`;
        prompt += `2. Short: "Explain the difference between permutation and combination with examples from real-life situations."\n`;
        prompt += `3. Long: "Derive the formula for the volume of a sphere using calculus, and explain its applications in solving real-world problems."`;
      }
      else if (subject.toLowerCase().includes('physics')) {
        prompt += `1. MCQ: "A body of mass 2 kg is moving with a velocity of 10 m/s. What is its kinetic energy?" Options: ["100 J", "200 J", "20 J", "1000 J"]\n`;
        prompt += `2. Short: "Explain the principle of conservation of angular momentum with an example."\n`;
        prompt += `3. Long: "Describe the photoelectric effect and how it provides evidence for the particle nature of light."`;
      }
      else if (subject.toLowerCase().includes('chemistry')) {
        prompt += `1. MCQ: "Which of the following is an example of a homogeneous mixture?" Options: ["Sand and water", "Salt solution", "Oil and water", "Granite"]\n`;
        prompt += `2. Short: "Explain the difference between physical and chemical changes with examples."\n`;
        prompt += `3. Long: "Describe the structure of the periodic table and explain how elements' properties relate to their positions."`;
      }
      else if (subject.toLowerCase().includes('computer')) {
        prompt += `1. MCQ: "What is the time complexity of binary search algorithm?" Options: ["O(n)", "O(n²)", "O(log n)", "O(n log n)"]\n`;
        prompt += `2. Short: "Explain the concept of inheritance in object-oriented programming with an example."\n`;
        prompt += `3. Long: "Describe how the TCP/IP protocol suite enables reliable communication over the internet."`;
      }
      else if (subject.toLowerCase().includes('biology')) {
        prompt += `1. MCQ: "Which of the following is NOT a function of the liver?" Options: ["Detoxification", "Production of insulin", "Production of bile", "Storage of glycogen"]\n`;
        prompt += `2. Short: "Explain the process of cellular respiration and its significance."\n`;
        prompt += `3. Long: "Describe the structure and function of DNA and explain how it replicates."`;
      }
      else if (subject.toLowerCase().includes('history')) {
        prompt += `1. MCQ: "Which event directly led to the start of World War I?" Options: ["The Great Depression", "Assassination of Archduke Franz Ferdinand", "The Treaty of Versailles", "Russian Revolution"]\n`;
        prompt += `2. Short: "Explain the significance of the Industrial Revolution on society."\n`;
        prompt += `3. Long: "Analyze the causes and consequences of the French Revolution."`;
      }
      else if (subject.toLowerCase().includes('language') || subject.toLowerCase().includes('english')) {
        prompt += `1. MCQ: "Which literary device is used in the phrase 'The wind whispered through the trees'?" Options: ["Metaphor", "Personification", "Simile", "Hyperbole"]\n`;
        prompt += `2. Short: "Explain the difference between a protagonist and an antagonist with examples."\n`;
        prompt += `3. Long: "Analyze the themes of identity and belonging in modern literature."`;
      }
      else {
        prompt += `1. MCQ: "Which of the following best describes a key concept in ${subject}?" Options: ["First option", "Second option", "Third option", "Fourth option"]\n`;
        prompt += `2. Short: "Explain an important principle in ${subject} and its significance."\n`;
        prompt += `3. Long: "Analyze a major theory or framework in ${subject} and discuss its applications."`;
      }
    }
    
    prompt += `\n\nThe response should be a valid JSON object with the following structure:
    {
      "questions": [
        {
          "text": "The question text - must be specific and meaningful",
          "type": "(one of: mcq, short, long, diagram, code, hots, case_study)",
          "difficulty": "(easy, medium, hard)",
          "marks": (integer value representing marks for this question),
          "topic": "${topic}",
          "bloomsTaxonomy": "(if applicable)",
          "options": ["option1", "option2", "option3", "option4"], // REQUIRED for MCQs, must have EXACTLY 4 options
          "correctAnswer": "the correct option text", // REQUIRED for MCQs
          "explanation": "Explanation of the answer or solution"
        }
        // More questions...
      ]
    }
    
    IMPORTANT: For all MCQ questions, you MUST provide exactly 4 options (no more, no less).
    Ensure the response is a valid JSON format with NO line breaks or special characters within string values.`;
    
    return prompt;
  }

  /**
   * Solve a given question
   */
  async solveQuestion(question, subject, model = DEFAULT_MODEL) {
    try {
      logger.info(`Solving question: ${question}`);

      // Make API call to Groq
      const result = await client.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `You are a helpful AI tutor. A student is asking you the following question. Please provide a detailed solution and explanation:
            ${question}`,
          },
        ],
        model: model,
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9,
      });

      const content = result.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from Groq API');
      }

      logger.info('Successfully generated solution');
      return content;
    } catch (error) {
      logger.error('Error solving question:', error);
      throw new Error(`Failed to solve question: ${error.message}`);
    }
  }

  /**
   * Solve a question paper (multiple questions)
   */
  async solveQuestionPaper(questions, subject, model = DEFAULT_MODEL) {
    const solvedQuestions = [];

    for (const question of questions) {
      try {
        // Use instance method now
        const solvedQuestion = await this.solveQuestion(question, subject, model);
        solvedQuestions.push(solvedQuestion);
      } catch (error) {
        logger.error(`Error solving question "${question}":`, error);
        solvedQuestions.push(`Error: ${error.message}`);
      }
    }

    if (solvedQuestions.every(sol => sol.startsWith('Error:'))) {
      throw new Error('Failed to solve any questions in the paper');
    }

    return solvedQuestions;
  }

  /**
   * Create the prompt for solving questions
   */
  createSolveQuestionPrompt(question, subject) {
    let prompt = `Please solve the following question with a detailed step-by-step explanation: "${question}"`;

    if (subject) {
      prompt += ` The question is from the subject area of ${subject}.`;
    }

    prompt += `\n\nPlease provide a clear, accurate, and detailed solution. Include:
1. Your understanding of what the question is asking
2. Step-by-step working or reasoning
3. The final answer clearly marked
4. Any relevant formulas, theorems, or concepts used
5. If applicable, alternative approaches to solve it`;

    return prompt;
  }

  /**
   * Ensure we have the exact number of questions for each type and difficulty as specified in the distribution
   */
  ensureQuestionCount(generatedQuestions, questionDistribution, topic, subject) {
    // First, organize questions by type for better grouping
    const organizedQuestions = {};
    generatedQuestions.forEach(question => {
      if (!organizedQuestions[question.type]) {
        organizedQuestions[question.type] = [];
      }
      organizedQuestions[question.type].push(question);
    });
    
    // Create a map to track how many questions we have for each type and difficulty
    const questionCounts = new Map();
    
    // Count the questions we have by type and difficulty
    generatedQuestions.forEach(question => {
      const key = `${question.type}-${question.difficulty}`;
      const count = questionCounts.get(key) || 0;
      questionCounts.set(key, count + 1);
    });
    
    // Track what we need to generate
    let totalMissingQuestions = 0;
    let subjectName = subject ? subject : "general";
    
    // First pass: calculate total missing questions
    questionDistribution.forEach(distItem => {
      const key = `${distItem.type}-${distItem.difficulty}`;
      const currentCount = questionCounts.get(key) || 0;
      
      if (currentCount < distItem.count) {
        const missingCount = distItem.count - currentCount;
        totalMissingQuestions += missingCount;
      }
    });
    
    // Log the total needed questions
    if (totalMissingQuestions > 0) {
      console.log(`Need to generate ${totalMissingQuestions} additional ${subjectName} questions to meet the distribution requirements.`);
      console.log(`Topic: ${topic}`);
    }
    
    // Second pass: generate missing questions
    questionDistribution.forEach(distItem => {
      const key = `${distItem.type}-${distItem.difficulty}`;
      const currentCount = questionCounts.get(key) || 0;
      
      // If we have fewer questions than requested, create new ones
      if (currentCount < distItem.count) {
        const missingCount = distItem.count - currentCount;
        console.log(`Generating ${missingCount} ${distItem.difficulty} ${distItem.type} questions for ${subjectName}.`);
        
        // Get existing questions of this type and difficulty to avoid duplication
        const existingQuestions = generatedQuestions.filter(
          q => q.type === distItem.type && q.difficulty === distItem.difficulty
        );
        
        const existingTexts = existingQuestions.map(q => q.text);
        
        // Create unique missing questions
        for (let i = 0; i < missingCount; i++) {
          // Generate a unique question that doesn't match existing ones
          let newQuestion;
          let attempts = 0;
          let isUnique = false;
          
          do {
            newQuestion = this.generateMeaningfulQuestion(
              topic, 
              distItem.type, 
              distItem.difficulty, 
              distItem.marks,
              subject,
              i // Pass index to help create variation
            );
            
            // Check if this question text is unique
            isUnique = !existingTexts.includes(newQuestion.text);
            attempts++;
            
            // If not unique and we've tried a few times, modify the question slightly
            if (!isUnique && attempts > 3) {
              // Add subject-specific modification to ensure uniqueness
              if (subject) {
                newQuestion.text = `For ${subject}: ${newQuestion.text} (Variant ${attempts})`;
              } else {
                newQuestion.text = `${newQuestion.text} (Variant ${attempts})`;
              }
              isUnique = true;
            }
          } while (!isUnique && attempts < 10);
          
          // Add to the appropriate type array in organized questions
          if (!organizedQuestions[distItem.type]) {
            organizedQuestions[distItem.type] = [];
          }
          
          // Ensure the marks match exactly what was requested
          newQuestion.marks = distItem.marks;
          
          // If subject is specified, add it to the question object
          if (subject) {
            newQuestion.subject = subject;
          }
          
          // Add to organized questions and track it
          organizedQuestions[distItem.type].push(newQuestion);
          existingTexts.push(newQuestion.text); // Add to existing texts to prevent duplicates
          
          // Log each generated question for debugging
          console.log(`Generated ${distItem.type} question: ${newQuestion.text.substring(0, 60)}...`);
        }
      } 
      // If we have more questions than requested, keep only the requested number
      else if (currentCount > distItem.count) {
        // Find all questions of this type and difficulty
        const questionsOfType = generatedQuestions.filter(
          q => q.type === distItem.type && q.difficulty === distItem.difficulty
        );
        
        console.log(`Trimming excess ${distItem.type} questions for ${subjectName} (have ${currentCount}, need ${distItem.count}).`);
        
        // Determine how many to keep
        const toKeep = questionsOfType.slice(0, distItem.count);
        
        // Update the organized questions to only include the ones to keep
        if (organizedQuestions[distItem.type]) {
          organizedQuestions[distItem.type] = organizedQuestions[distItem.type].filter(q => {
            // Keep if it's not of this type/difficulty or if it's in the toKeep list
            return !(q.type === distItem.type && q.difficulty === distItem.difficulty) || 
                  toKeep.some(keep => keep.text === q.text);
          });
          
          // Add back the ones to keep
          const existing = organizedQuestions[distItem.type].filter(
            q => q.type === distItem.type && q.difficulty === distItem.difficulty
          );
          
          if (existing.length < toKeep.length) {
            const missing = toKeep.filter(keep => 
              !existing.some(ex => ex.text === keep.text)
            );
            organizedQuestions[distItem.type].push(...missing);
          }
        }
      }
    });
    
    // Flatten the organized questions, preserving type grouping
    const finalQuestions = [];
    
    // Define order of question types
    const typeOrder = ['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'];
    
    // Add questions in the defined type order
    typeOrder.forEach(type => {
      if (organizedQuestions[type] && organizedQuestions[type].length > 0) {
        finalQuestions.push(...organizedQuestions[type]);
      }
    });
    
    // Final validation - verify counts match what was requested
    let totalExpected = 0;
    let totalActual = 0;
    
    questionDistribution.forEach(distItem => {
      const countByType = finalQuestions.filter(
        q => q.type === distItem.type && q.difficulty === distItem.difficulty
      ).length;
      
      totalExpected += distItem.count;
      totalActual += countByType;
      
      if (countByType !== distItem.count) {
        console.log(`Warning: Expected ${distItem.count} ${distItem.type} questions with ${distItem.difficulty} difficulty, but got ${countByType}`);
      }
    });
    
    if (totalActual !== totalExpected) {
      console.log(`Warning: Total questions expected ${totalExpected}, actual ${totalActual} for ${subjectName}`);
    } else {
      console.log(`Successfully generated all ${totalActual} ${subjectName} questions according to the specified distribution.`);
    }
    
    return finalQuestions;
  }
  
  /**
   * Generate a meaningful question when we need to fill in missing questions
   */
  generateMeaningfulQuestion(topic, type, difficulty, marks, subject, index = 0) {
    // Arrays of varied question templates for each type and difficulty - without mentioning topic directly
    const templates = {
      mcq: {
        easy: [
          "Which of the following statements is correct?",
          "What is the primary concept in this field of study?",
          "Which principle best explains this basic phenomenon?",
          "Which of these is a fundamental fact in this subject area?"
        ],
        medium: [
          "How do these principles impact related systems?",
          "What would happen if these concepts were applied to a novel situation?",
          "Which application demonstrates the practical utility of this theory?",
          "When analyzing this problem, which approach yields the most accurate results?"
        ],
        hard: [
          "Which advanced theory best explains these complex relationships?",
          "What are the far-reaching implications of these principles in this domain?",
          "How would you solve this multi-step problem using appropriate methods?",
          "What is the relationship between these advanced theoretical concepts?"
        ]
      },
      short: {
        easy: [
          "Explain this principle in your own words.",
          "What are the key concepts in this field?",
          "Describe the importance of this theory in modern applications.",
          "Outline the basic framework of this system."
        ],
        medium: [
          "Compare and contrast these related theoretical approaches.",
          "Explain how this process affects interconnected systems.",
          "Analyze the application of these principles in real-world scenarios.",
          "Describe the evolution of understanding in this field."
        ],
        hard: [
          "Critically evaluate the current theoretical understanding in this area.",
          "Analyze how these principles interact with other complex systems.",
          "Explain the limitations of current approaches to this problem.",
          "Evaluate the significance of recent developments in this field."
        ]
      },
      long: {
        easy: [
          "Describe in detail the key components and processes of this system.",
          "Explain the historical development and current understanding of this theory.",
          "Outline these fundamental principles with relevant examples.",
          "Describe how these concepts are applied in practical situations."
        ],
        medium: [
          "Discuss the significance and applications of these principles in modern contexts.",
          "Analyze the relationship between these theories and related concepts.",
          "Explain how this field has evolved and its current state of development.",
          "Evaluate the strengths and weaknesses of different approaches to this problem."
        ],
        hard: [
          "Critically analyze these theoretical foundations and propose improvements.",
          "Synthesize multiple perspectives on this problem and develop your own framework.",
          "Evaluate competing theories and argue for the most convincing approach.",
          "Analyze this complex scenario and develop a comprehensive solution."
        ]
      }
    };
    
    // Subject-specific templates
    const subjectTemplates = {};
    
    // Math-specific templates
    if (subject && (subject.toLowerCase().includes('math') || subject.toLowerCase().includes('algebra') || 
        subject.toLowerCase().includes('geometry') || subject.toLowerCase().includes('calculus'))) {
      subjectTemplates.mcq = {
        easy: [
          "Find the solution to this equation: If x + 5 = 12, what is the value of x?",
          "What is the area of a rectangle with length 8 units and width 6 units?",
          "Which of the following is the correct formula for the area of a circle?",
          "If a number is divisible by both 2 and 3, it is also divisible by what number?"
        ],
        medium: [
          "A quadratic equation has roots at x = 2 and x = -3. What is the equation in standard form?",
          "In a right-angled triangle, if one angle is 30°, what is the other acute angle?",
          "Which trigonometric function equals the ratio of the opposite side to the hypotenuse?",
          "If f(x) = 2x² + 3x - 5, what is the value of f(2)?"
        ],
        hard: [
          "Which method would you use to determine the convergence of an infinite series?",
          "In a coordinate geometry problem involving a circle, what is the relationship between the center, radius, and a point on the circle?",
          "Given a polynomial function, how would you find all its roots if one root is already known?",
          "What theorem helps determine if a given matrix is diagonalizable?"
        ]
      };
      
      subjectTemplates.short = {
        easy: [
          "Explain the difference between permutation and combination with examples.",
          "Describe the properties of parallel lines in Euclidean geometry.",
          "Explain what makes a quadrilateral a parallelogram.",
          "Describe the relationship between the radius and diameter of a circle."
        ],
        medium: [
          "Explain how the quadratic formula is derived from the standard form of a quadratic equation.",
          "Describe the relationship between differentiation and integration in calculus.",
          "Explain how to use the sine and cosine rules to solve triangles.",
          "Describe the properties of a normal distribution in statistics."
        ],
        hard: [
          "Explain the fundamental theorem of calculus and its significance in mathematics.",
          "Describe how eigenvalues and eigenvectors are used in linear transformations.",
          "Explain the concept of statistical hypothesis testing with examples.",
          "Discuss the importance of number theory in modern cryptography."
        ]
      };
      
      subjectTemplates.long = {
        easy: [
          "Explain the concept of factorization of algebraic expressions with examples.",
          "Describe the properties and applications of different types of quadrilaterals.",
          "Explain the concept of linear equations and methods to solve them.",
          "Describe the properties of triangles and their significance in geometry."
        ],
        medium: [
          "Explain the concept of functions, their types, and applications with relevant examples.",
          "Describe the methods for solving systems of linear equations and their applications.",
          "Explain the concept of probability, its laws, and applications with examples.",
          "Describe the properties of geometric sequences and series with applications."
        ],
        hard: [
          "Explain differential calculus, its principles, and applications in real-world problems.",
          "Describe the concepts of vectors, vector spaces, and their applications in physics and engineering.",
          "Explain the principles of statistical inference and their applications in data analysis.",
          "Describe the concepts of complex numbers, their geometric interpretation, and applications."
        ]
      };
    }
    // Physics-specific templates
    else if (subject && subject.toLowerCase().includes('physics')) {
      subjectTemplates.mcq = {
        easy: [
          "What is the SI unit of force?",
          "Which of the following is the formula for calculating work done?",
          "What type of energy does a moving object possess?",
          "Which physical quantity remains constant in an isolated system according to conservation laws?"
        ],
        medium: [
          "A 2 kg object moving at 5 m/s collides with a stationary object. What principle determines the outcome?",
          "Which wave phenomenon explains the bending of light as it passes from air to water?",
          "In an electrical circuit, what determines the current according to Ohm's law?",
          "What happens to the wavelength of light when it passes through a medium with higher refractive index?"
        ],
        hard: [
          "Which quantum principle describes the impossibility of simultaneously measuring position and momentum precisely?",
          "What is the relativistic effect on mass as an object approaches the speed of light?",
          "In thermodynamics, which law relates to the increase of entropy in isolated systems?",
          "How does the strong nuclear force vary with distance between nucleons?"
        ]
      };
      
      subjectTemplates.short = {
        easy: [
          "Explain Newton's three laws of motion.",
          "Describe the difference between scalar and vector quantities with examples.",
          "Explain the concept of potential energy.",
          "Describe how sound waves propagate through different media."
        ],
        medium: [
          "Explain the principle of conservation of energy with examples.",
          "Describe the electromagnetic spectrum and its applications.",
          "Explain how a simple electric motor works.",
          "Describe the relationship between force, pressure and area."
        ],
        hard: [
          "Explain the concept of wave-particle duality in quantum mechanics.",
          "Describe Einstein's special theory of relativity and its implications.",
          "Explain the principles of nuclear fission and fusion.",
          "Describe the quantum mechanical model of the atom."
        ]
      };
    }
    // Chemistry-specific templates
    else if (subject && subject.toLowerCase().includes('chemistry')) {
      subjectTemplates.mcq = {
        easy: [
          "Which of the following is an example of a chemical change?",
          "What type of bond forms between two non-metal atoms?",
          "Which element has the electronic configuration 2,8,8,1?",
          "What is the pH of a neutral solution at 25°C?"
        ],
        medium: [
          "Which orbital has the quantum numbers n=3, l=1?",
          "What type of isomerism is exhibited by butane and 2-methylpropane?",
          "Which functional group characterizes alcohols?",
          "What happens to the rate of reaction when a catalyst is added?"
        ],
        hard: [
          "Which principle explains why electron affinity generally decreases down a group in the periodic table?",
          "What is the hybridization of carbon in acetylene (C₂H₂)?",
          "Which mechanism best explains the reaction between alkenes and hydrogen halides?",
          "What is the relationship between Gibbs free energy and spontaneity of a reaction?"
        ]
      };
    }
    // Computer Science/Programming templates
    else if (subject && (subject.toLowerCase().includes('computer') || subject.toLowerCase().includes('programming'))) {
      subjectTemplates.mcq = {
        easy: [
          "Which data structure operates on a First-In-First-Out (FIFO) principle?",
          "What is the purpose of a constructor in object-oriented programming?",
          "Which sorting algorithm has the best average time complexity?",
          "What does HTML stand for in web development?"
        ],
        medium: [
          "What is the time complexity of binary search?",
          "Which design pattern would you use to create objects without specifying their concrete classes?",
          "What problem does normalization solve in database design?",
          "Which networking protocol is connectionless?"
        ],
        hard: [
          "Which algorithm would be most efficient for finding the shortest path in a weighted graph?",
          "What is the significance of the CAP theorem in distributed systems?",
          "Which concurrency control mechanism would best prevent deadlock in a multi-threaded application?",
          "How does public key cryptography ensure secure communication?"
        ]
      };
      
      subjectTemplates.short = {
        easy: [
          "Explain the difference between a stack and a queue with examples.",
          "Describe the principles of object-oriented programming.",
          "Explain how a binary search algorithm works.",
          "Describe the client-server architecture in networking."
        ],
        medium: [
          "Explain the concept of recursion and provide an example.",
          "Describe the MVC architectural pattern and its benefits.",
          "Explain the principles of database normalization.",
          "Describe how virtual memory works in operating systems."
        ],
        hard: [
          "Explain the concept of polymorphism and its implementation in programming.",
          "Describe the principles and applications of machine learning algorithms.",
          "Explain how blockchain technology ensures data integrity and security.",
          "Describe the principles of concurrent programming and thread synchronization."
        ]
      };
    }
    // Biology-specific templates
    else if (subject && subject.toLowerCase().includes('biology')) {
      subjectTemplates.mcq = {
        easy: [
          "Which organelle is known as the powerhouse of the cell?",
          "What is the main function of the respiratory system?",
          "Which process converts glucose to pyruvate?",
          "What type of tissue connects bones to muscles?"
        ],
        medium: [
          "Which phase of meiosis involves crossing over?",
          "What is the role of tRNA in protein synthesis?",
          "Which hormone regulates blood glucose levels?",
          "What is the function of the Golgi apparatus in a cell?"
        ],
        hard: [
          "Which principle best explains the non-Mendelian inheritance pattern observed in this genetic disorder?",
          "What mechanism regulates gene expression in prokaryotes?",
          "How does feedback inhibition control metabolic pathways?",
          "What is the relationship between natural selection and genetic drift in evolutionary processes?"
        ]
      };
    }
    // History-specific templates
    else if (subject && (subject.toLowerCase().includes('history') || subject.toLowerCase().includes('social studies'))) {
      subjectTemplates.mcq = {
        easy: [
          "When did World War II end?",
          "Who was the first President of the United States?",
          "Which civilization built the pyramids at Giza?",
          "What document established the United Nations?"
        ],
        medium: [
          "Which economic system emerged during the Industrial Revolution?",
          "What was the main cause of the French Revolution?",
          "Which treaty ended World War I?",
          "What impact did the printing press have on European society?"
        ],
        hard: [
          "How did cold war ideologies influence post-colonial movements in developing nations?",
          "Which philosophical movement most influenced the framers of the U.S. Constitution?",
          "What factors led to the collapse of the Roman Empire?",
          "How did geographic factors influence the development of ancient civilizations?"
        ]
      };
    }
    // Language/Literature templates
    else if (subject && (subject.toLowerCase().includes('language') || subject.toLowerCase().includes('literature') || subject.toLowerCase().includes('english'))) {
      subjectTemplates.mcq = {
        easy: [
          "Which of these is an example of a simile?",
          "What is the main function of a verb in a sentence?",
          "Which literary movement emphasized emotion and individualism?",
          "What is the definition of a synonym?"
        ],
        medium: [
          "Which narrative technique involves revealing events out of chronological order?",
          "What rhetorical device repeats consonant sounds at the beginning of words?",
          "Which poetic form consists of fourteen lines with a specific rhyme scheme?",
          "What grammatical function does a subordinating conjunction serve?"
        ],
        hard: [
          "Which literary theory would best analyze the class dynamics in this text?",
          "What linguistic phenomenon explains the evolution of this grammatical structure?",
          "Which narrative perspective creates the most limited point of view?",
          "How does metafiction challenge conventional narrative structures?"
        ]
      };
    }
    
    // Get subject-specific variations if needed
    let questionText = "";
    let options = [];
    
    // Select a template based on type, difficulty, and index
    if (subject && subjectTemplates[type] && subjectTemplates[type][difficulty]) {
      // Use subject-specific template
      const templateOptions = subjectTemplates[type][difficulty];
      const templateIndex = index % templateOptions.length;
      questionText = templateOptions[templateIndex];
    } else if (templates[type] && templates[type][difficulty]) {
      // Use general template
      const templateOptions = templates[type][difficulty];
      const templateIndex = index % templateOptions.length;
      questionText = templateOptions[templateIndex];
    } else {
      // Fallback for types not in the template
      questionText = "Answer the following question about this concept.";
    }
    
    // For MCQs, generate varied options specific to the subject
    if (type === 'mcq') {
      if (subject && subject.toLowerCase().includes('math')) {
        // Use math-specific options based on the question
        if (questionText.includes('equation')) {
          options = ["x = 5", "x = 7", "x = 8", "x = 9"];
        } else if (questionText.includes('area')) {
          options = ["36 square units", "48 square units", "14 square units", "24 square units"];
        } else if (questionText.includes('circle')) {
          options = ["A = 2πr", "A = πr", "A = πr²", "A = 2πr²"];
        } else if (questionText.includes('divisible')) {
          options = ["4", "5", "6", "9"];
        } else if (questionText.includes('quadratic')) {
          options = ["x² - x - 6 = 0", "x² + x - 6 = 0", "x² - x + 6 = 0", "x² + x + 6 = 0"];
        } else if (questionText.includes('triangle')) {
          options = ["45°", "60°", "90°", "180°"];
        } else if (questionText.includes('trigonometric')) {
          options = ["sine", "cosine", "tangent", "secant"];
        } else if (questionText.includes('f(x)')) {
          options = ["7", "9", "11", "13"];
        } else if (questionText.includes('convergence')) {
          options = ["Ratio test", "Root test", "Integral test", "Comparison test"];
        } else if (questionText.includes('matrix')) {
          options = ["Eigenvalue Theorem", "Diagonalization Theorem", "Characteristic Equation", "Cayley-Hamilton Theorem"];
        } else {
          // Default math options
          options = [
            "The first mathematical option", 
            "The second mathematical option", 
            "The third mathematical option", 
            "The correct mathematical answer"
          ];
        }
      } 
      else if (subject && subject.toLowerCase().includes('physics')) {
        if (questionText.includes('SI unit')) {
          options = ["Newton", "Joule", "Watt", "Pascal"];
        } else if (questionText.includes('energy')) {
          options = ["Potential energy", "Kinetic energy", "Thermal energy", "Nuclear energy"];
        } else if (questionText.includes('conservation')) {
          options = ["Momentum", "Acceleration", "Velocity", "Force"];
        } else if (questionText.includes('quantum')) {
          options = ["Uncertainty principle", "Wave function collapse", "Quantum entanglement", "Pauli exclusion principle"];
        } else {
          options = [
            "First physics concept",
            "Second physics concept",
            "Third physics concept",
            "Correct physics answer"
          ];
        }
      }
      else if (subject && subject.toLowerCase().includes('chemistry')) {
        if (questionText.includes('chemical change')) {
          options = ["Melting of ice", "Evaporation of water", "Rusting of iron", "Grinding of salt"];
        } else if (questionText.includes('bond')) {
          options = ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"];
        } else if (questionText.includes('pH')) {
          options = ["0", "7", "14", "1"];
        } else {
          options = [
            "First chemistry concept",
            "Second chemistry concept",
            "Third chemistry concept",
            "Correct chemistry answer"
          ];
        }
      }
      else if (subject && (subject.toLowerCase().includes('computer') || subject.toLowerCase().includes('programming'))) {
        if (questionText.includes('data structure')) {
          options = ["Stack", "Queue", "Binary tree", "Hash table"];
        } else if (questionText.includes('time complexity')) {
          options = ["O(1)", "O(n)", "O(log n)", "O(n²)"];
        } else if (questionText.includes('design pattern')) {
          options = ["Singleton", "Factory", "Observer", "Decorator"];
        } else {
          options = [
            "First programming concept",
            "Second programming concept",
            "Third programming concept",
            "Correct programming answer"
          ];
        }
      }
      else if (subject && subject.toLowerCase().includes('biology')) {
        if (questionText.includes('organelle')) {
          options = ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"];
        } else if (questionText.includes('meiosis')) {
          options = ["Prophase I", "Metaphase I", "Anaphase I", "Telophase I"];
        } else if (questionText.includes('hormone')) {
          options = ["Insulin", "Thyroxine", "Estrogen", "Testosterone"];
        } else {
          options = [
            "First biological concept",
            "Second biological concept",
            "Third biological concept",
            "Correct biological answer"
          ];
        }
      }
      else {
        // Use generic option templates for non-specific subjects
      const optionTemplates = [
        ["Incorrect option based on a common misconception", "Partially correct but incomplete option", "Option that seems plausible but contains errors", "The correct and complete answer"],
        ["Option that misapplies a principle", "Option using an outdated theory", "Option with calculation errors", "Correct application of principles"],
        ["First incorrect approach", "Second incorrect approach", "Third incorrect approach", "Correct approach"],
        ["Option with logical fallacy", "Option with incomplete reasoning", "Option missing key considerations", "Option with complete and correct reasoning"]
      ];
      
      // Use the index to select different option templates
      const optionIndex = index % optionTemplates.length;
      options = optionTemplates[optionIndex];
      }
    }
    
    // Create the question object
    const question = {
      text: questionText,
      type: type,
      difficulty: difficulty,
      marks: marks || this.getDefaultMarks(type, difficulty),
      topic: topic
    };
    
    // Add options for MCQ
    if (type === 'mcq') {
      question.options = options;
      question.correctAnswer = options[3]; // Default to the last option as correct
    }
    
    return question;
  }
}

module.exports = new GroqService(); 