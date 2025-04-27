# 🚀 Ignitia - AI Question Paper Designer & Solver

Create and solve customized academic question papers with AI-powered precision, making assessment creation effortless for educators across all subjects and levels.

## 📌 Problem Statement
Transforming Education tasks with AI

## 🎯 Objective
Ignitia addresses the time-consuming, labor-intensive process of creating high-quality assessment materials. Educators often spend hours crafting question papers, struggling to maintain consistent quality, appropriate difficulty levels, and alignment with learning objectives.

Our platform serves teachers, educational institutions, and students by automating the creation of professional question papers across multiple subjects, difficulty levels, and question formats. It provides immediate value by reducing what typically takes hours to just minutes, while maintaining pedagogical quality and academic rigor.

## 🧠 Team & Approach

### Team Name:
Serelium

### Team Members:
- Utkarsh Singh (GitHub: btechwala999 / Role: Full Stack Developer)
- Daivik Neogi (Github: daineo / Role: Frontend Developer)

### Your Approach:
We chose this problem because assessment creation is a universal pain point in education globally. The manual process consumes valuable teacher time that could be better spent on instruction and student interaction.

The key challenges we addressed were:
1. Generating academically rigorous questions across multiple subjects and formats
2. Creating a flexible system to handle various question types (MCQs, short/long answers)
3. Developing a robust PDF generation system with proper formatting and layout
4. Ensuring the system works efficiently within cloud deployment constraints

Our breakthrough came when we pivoted from Puppeteer to PDFKit for document generation, implementing absolute positioning techniques that solved persistent layout issues and dramatically improved performance.

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend**: React, JavaScript, Tailwind CSS, React Query, React Router
- **Backend**: Node.js, Express, JavaScript
- **Database**: MongoDB Atlas
- **APIs**: Custom REST API
- **Hosting**: Render (Backend), Vercel (Frontend)

### Sponsor Technologies Used:
- ✅ **Groq**: We leveraged Groq's LLaMA 3 70B model for ultra-fast question generation, prompt engineering to create context-rich queries, and JSON response structuring for consistent output.

## ✨ Key Features

✅ **AI-powered Question Generation**: Generate high-quality questions instantly across multiple subjects and difficulty levels
✅ **Multiple Question Types**: Support for MCQs, short answers, long answers, diagrams, code questions, and HOTS
✅ **Professional PDF Export**: Create perfectly formatted question papers with proper spacing, layout, and pagination
✅ **Question Bank**: Save and organize questions for future use
✅ **Taxonomic Classification**: Target specific cognitive levels using Bloom's Taxonomy
✅ **Answer Generation**: Provide detailed solutions and explanations for questions

## 📽️ Demo & Deliverables
Demo Video Link: https://youtu.be/qPKK-s5T000
Pitch Deck Link: https://docs.google.com/presentation/d/1xKHrXg7bAN2Ix-jfouW8hIhJ9oHXIMyz/edit?usp=drive_link&ouid=117876365010684076430&rtpof=true&sd=true

## 🧪 How to Run the Project

### Requirements:
- Node.js (v18 or higher)
- MongoDB
- Groq API key

### Local Setup:
```bash
# Clone the repo
git clone https://github.com/btechwala999/Ignitia.git

# Backend setup
cd Ignitia/server
npm install

# Create .env file with the following variables:
# PORT=5000
# NODE_ENV=development
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_here
# JWT_EXPIRES_IN=24h
# GROQ_API_KEY=your_groq_api_key_here

# Start backend
npm run dev

# Frontend setup
cd ../client
npm install

# Start frontend
npm run dev
```

## 🧬 Future Scope
- 📊 **Analytics Dashboard**: Provide insights on student performance and question effectiveness
- 🌐 **Multi-language Support**: Expand to generate questions in multiple languages
- 🧩 **Custom Templates**: Allow institutions to create branded question paper templates
- 🤖 **Advanced AI Tutoring**: Expand answer generation into full tutoring capabilities
- 📱 **Mobile Application**: Develop companion apps for on-the-go assessment creation

## 📎 Resources / Credits
- Groq API for powerful LLM capabilities
- PDFKit for PDF generation
- MongoDB Atlas for database hosting
- Render and Vercel for application hosting
- Open source libraries: Express, React, Tailwind CSS

## 🏁 Final Words
Our journey building Ignitia during this hackathon has been transformative. The biggest challenge we faced was creating a reliable PDF generation system that produced professional-quality documents suitable for academic use. After pivoting from Puppeteer to PDFKit and implementing absolute positioning techniques, we achieved breakthrough results.

We've learned that AI can dramatically transform educational workflows when applied to specific pain points. The speed of Groq's API was particularly impressive, allowing us to generate complex academic content in seconds instead of minutes.

We're excited about the potential impact of this tool for educators worldwide, freeing them from administrative tasks to focus on what matters most - teaching and connecting with students.
