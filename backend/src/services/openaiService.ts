import Groq from 'groq-sdk';
import { AssignmentInput, GeneratedPaper, Section, Question } from '../types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildPrompt(input: AssignmentInput): string {
  const totalQuestions = input.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions, 0);
  const totalMarks = input.questionTypes.reduce((s, qt) => s + qt.numberOfQuestions * qt.marksPerQuestion, 0);
  const sectionsDesc = input.questionTypes.map((qt, i) =>
    `Section ${String.fromCharCode(65 + i)}: ${qt.numberOfQuestions} x ${qt.type} (${qt.marksPerQuestion} mark each)`
  ).join('\n');

  return `Create a question paper JSON for:
Subject: ${input.subject}, Class: ${input.className}, Total: ${totalQuestions} questions, ${totalMarks} marks
School: ${input.schoolName || 'Delhi Public School'}
${input.additionalInstructions ? `Note: ${input.additionalInstructions}` : ''}
Sections: ${sectionsDesc}

Output ONLY this JSON (fill in real questions for ${input.subject}):
{"schoolName":"${input.schoolName || 'Delhi Public School'}","subject":"${input.subject}","className":"${input.className}","timeAllowed":"${Math.ceil(totalMarks * 1.2)} minutes","totalMarks":${totalMarks},"instructions":["All questions are compulsory.","Marks are in brackets."],"sections":[{"id":"section-a","title":"Section A","instruction":"Attempt all questions.","questionType":"${input.questionTypes[0]?.type || 'Short Answer'}","questions":[{"id":"q1","text":"REPLACE WITH REAL QUESTION?","difficulty":"easy","marks":${input.questionTypes[0]?.marksPerQuestion || 1},"type":"${input.questionTypes[0]?.type || 'Short Answer'}","answer":"REPLACE WITH REAL ANSWER"}],"totalMarks":${(input.questionTypes[0]?.numberOfQuestions || 1) * (input.questionTypes[0]?.marksPerQuestion || 1)}}],"answerKey":[{"questionId":"q1","answer":"REPLACE WITH REAL ANSWER"}]}

Rules: difficulty must be "easy"|"medium"|"hard", generate exactly ${totalQuestions} total questions across ${input.questionTypes.length} section(s), all about ${input.subject}. Return only JSON.`;
}

function extractAndFixJSON(raw: string): any {
  let text = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  if (text.startsWith('{{')) text = text.substring(1);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error(`No JSON found. Got: ${text.substring(0, 150)}`);
  const jsonStr = text.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    const fixed = jsonStr.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"');
    try { return JSON.parse(fixed); }
    catch { throw new Error('Failed to parse AI response as JSON'); }
  }
}

export async function generateAssessment(
  input: AssignmentInput,
  onProgress?: (progress: number, message: string) => void
): Promise<GeneratedPaper> {
  onProgress?.(10, 'Preparing prompt...');
  const prompt = buildPrompt(input);
  onProgress?.(20, 'Calling Groq LLaMA...');

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert educational assessment creator. CRITICAL: Respond with ONLY a valid JSON object. No markdown backticks. No explanation. Start with { and end with }.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  onProgress?.(70, 'Parsing response...');
  const rawContent = response.choices[0]?.message?.content || '';
  if (!rawContent.trim()) throw new Error('Empty response from Groq');
  console.log('📝 Groq raw (first 200):', rawContent.substring(0, 200));

  const parsed = extractAndFixJSON(rawContent);
  onProgress?.(85, 'Structuring paper...');

  // Always use the user's school name, not whatever AI returned
  const schoolName = input.schoolName || parsed.schoolName || 'My School';

  const sanitized: GeneratedPaper = {
    schoolName,
    subject: parsed.subject || input.subject,
    className: parsed.className || input.className,
    timeAllowed: parsed.timeAllowed || `${parsed.totalMarks || 60} minutes`,
    totalMarks: Number(parsed.totalMarks) || 0,
    instructions: Array.isArray(parsed.instructions) ? parsed.instructions : ['All questions are compulsory.'],
    sections: (Array.isArray(parsed.sections) ? parsed.sections : []).map((sec: any, si: number) => ({
      id: sec.id || `section-${si}`,
      title: sec.title || `Section ${String.fromCharCode(65 + si)}`,
      instruction: sec.instruction || 'Attempt all questions.',
      questionType: sec.questionType || 'Questions',
      totalMarks: Number(sec.totalMarks) || 0,
      questions: (Array.isArray(sec.questions) ? sec.questions : []).map((q: any, qi: number) => ({
        id: q.id || `q${si + 1}_${qi + 1}`,
        text: String(q.text || q.question || 'Question'),
        difficulty: ['easy', 'medium', 'hard'].includes(String(q.difficulty).toLowerCase())
          ? String(q.difficulty).toLowerCase() as 'easy' | 'medium' | 'hard'
          : 'medium',
        marks: Number(q.marks) || 1,
        type: q.type || sec.questionType || 'Question',
        answer: String(q.answer || q.solution || ''),
      })),
    })),
    answerKey: Array.isArray(parsed.answerKey) ? parsed.answerKey : [],
  };

  onProgress?.(100, 'Done!');
  return sanitized;
}
