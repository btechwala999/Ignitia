# Ignitia - Groq AI Question Paper Desiger & Solver

Ignitia is an advanced web application that leverages Groq's powerful AI to generate and solve academic questions for teachers, researchers, and students. The platform helps in creating, managing, and solving question papers across various subjects and difficulty levels.

## Features

### For Teachers & Educators
- **AI-powered Question Generation**: Generate high-quality questions instantly from topics or syllabus content
- **Customizable Question Types**: Create multiple question types: MCQ, Short Answer, Long Answer, Diagrams, Code-based
- **Advanced Configuration**: Set difficulty levels, Bloom's taxonomy targets, and more
- **Export Capabilities**: Export question papers in PDF format with or without answers
- **Syllabus Mapper**: Use syllabus content to generate highly relevant questions
- **Question Bank**: Save and organize questions for future use
- **Solve Questions**: AI-powered question paper solver with step-by-step answers

## AI-Powered Question Generation

The core feature of EduIQ is its AI-powered question generation system. It uses the Groq API with LLaMA 3 70B model to create high-quality educational questions based on:

- **Topic**: Generate questions on specific subject areas
- **Difficulty Level**: Easy, Medium, or Hard questions
- **Question Types**: MCQ, Short Answer, Long Answer, Diagram-based, or Code-based
- **Bloom's Taxonomy Level**: Target specific cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **Syllabus Input**: Use curriculum content to generate highly relevant questions

Each generated question includes:
- Question text
- Options (for MCQs)
- Correct answers
- Explanations
- Marks allocation based on difficulty
- Taxonomy classification

## Technology Stack

### Frontend
- React with JavaScript
- Tailwind CSS for styling
- React Query for state management
- React Router for navigation
- React Hook Form for form validation
- Zod for schema validation

### Backend
- Node.js with Express
- JavaScript for type safety
- MongoDB for database
- JWT for authentication
- Groq API for AI-powered features
- PDFKit for PDF generation (replacing Puppeteer)

### AI Integration
- GroqCloud API with LLaMA 3 70B model
- Prompt engineering for question generation and solving
- JSON structured responses for consistent output

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- Groq API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/btechwala999/Ignitia.git
```

2. Install dependencies for backend
```bash
cd server
npm install
```

3. Install dependencies for frontend
```bash
cd ../client
npm install
```

4. Set up environment variables
- Create a `.env` file in the server directory with:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h
GROQ_API_KEY=your_groq_api_key_here
```

5. Start the development servers
```bash
# In the server directory
npm run dev

# In the client directory
npm run dev
```

## Project Structure

```
eduiq/
├── client/                # Frontend React app
│   ├── public/            # Static files
│   │   ├── api/           # API service layers
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React contexts
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── ...
├── server/                # Backend Express app
│   ├── src/
│   │   ├── api/           # API endpoints
│   │   ├── config/        # Configuration files
│   │   ├── models/        # MongoDB models
│   │   ├── services/      # Business logic
│   │   ├── middlewares/   # Express middlewares
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   └── ...
└── ...
```

## Implementation Details

### AI Question Generation Flow
1. User selects topic, difficulty, question type, and other parameters
2. Frontend sends request to `/api/v1/question-papers/generate` endpoint
3. Backend constructs an optimized prompt for the Groq API
4. Groq API generates questions and returns structured JSON
5. Questions are displayed to user for review
6. User can save the generated questions as a question paper

### PDF Generation System
1. Custom PDF layout using PDFKit with absolute positioning for precise control
2. Structured format with parts (A, B, C, D) for different question types:
   - Part A: Multiple Choice Questions (MCQs)
   - Part B: Short answer, diagram, and code questions
   - Part C: Long answer questions
   - Part D: Higher Order Thinking Skills (HOTS) questions
3. Advanced layout features:
   - Registration number boxes
   - Examination header with class and year
   - Subject/topic information
   - Instruction notes
   - Time and marks details
   - Proper spacing and page breaks
4. Mathematical symbol support through text processing
5. Direct PDF buffer generation without browser dependencies

### Question Paper Management
1. Question papers are stored in MongoDB with references to creators
2. Role-based permissions ensure only authorized users can manage papers

## Deployment

The application is configured for deployment on Render with the following features:
- Direct PDF generation with PDFKit (no browser requirement)
- Environment configuration in `render.yaml` for streamlined deployment
- Optimized for performance in cloud environments

## Recent Updates

### PDF Generation Improvements
- Transitioned from Puppeteer to PDFKit for more efficient PDF generation
- Implemented absolute positioning for precise control of document layout
- Fixed spacing issues between different parts of the question paper
- Enhanced mathematical symbol support
- Improved overall document structure and formatting
- Consistent page breaks and spacing throughout the document

### Dependency and Configuration Updates
- Simplified dependency requirements
- Reduced deployment complexity and resource usage
- Streamlined development environment configuration
- Improved render.yaml for production deployment

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Groq for providing powerful AI capabilities
- The open-source community for various tools and libraries 
