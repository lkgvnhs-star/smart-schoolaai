import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import { ai } from '@/lib/gemini';
import { Type } from '@google/genai';

import { withRetry } from '@/lib/ai-retry';
import { cleanAiJson } from '@/lib/ai-utils';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }
  const { syllabusId, config } = body;
  
  const { data: syllabus, error: syllabusError } = await supabaseAdmin
    .from('syllabus')
    .select('content')
    .eq('id', syllabusId)
    .eq('school_id', session.schoolId)
    .single();

  if (syllabusError || !syllabus) {
    return NextResponse.json({ error: 'Syllabus not found' }, { status: 404 });
  }

  const prompt = `
    Generate a question paper based on the following syllabus content:
    ---
    ${syllabus.content}
    ---
    
    Configuration:
    - Subject: ${config.subject}
    - Max Marks: ${config.maxMarks}
    - Duration: ${config.duration}
    - Difficulty: ${config.difficulty}
    - Sections requested: ${config.sections.map((s: any) => `${s.title} (${s.count} qns, ${s.marks} marks/each)`).join(', ')}
    
    Rules:
    1. Only use topics from the provided syllabus.
    2. Adhere strictly to the question count and marks per section.
    3. Provide the correct answer/answer key for each question in the "answer" field.
    4. Format as requested in the JSON schema.
    5. For "Fill in the blanks" sections:
       - The question text MUST include a blank space represented by "________" where the answer should go.
       - DO NOT provide an "options" array (or keep it empty).
       - Set "type" to "fill_blanks".
    6. For "Multiple Choice" sections:
       - Provide exactly 4 options in the "options" array.
       - Set "type" to "mcq".
    7. For "Short Answers" and "Long Answers":
       - Set "type" to "short" or "long" respectively.
       - DO NOT provide "options".
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        type: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        marks: { type: Type.NUMBER }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ['sections']
        }
      }
    }));

    const cleanedText = cleanAiJson(response.text);
    const paperData = JSON.parse(cleanedText || '{"sections":[]}');
    
    const { data: fullPaper, error: paperError } = await supabaseAdmin
      .from('papers')
      .insert([{
        school_id: session.schoolId,
        school_name: config.schoolName,
        exam_title: config.examTitle,
        subject: config.subject,
        max_marks: config.maxMarks,
        duration: config.duration,
        sections: paperData.sections || []
      }])
      .select()
      .single();

    if (paperError) return NextResponse.json({ error: paperError.message }, { status: 500 });
    return NextResponse.json(fullPaper);
  } catch (aiError: any) {
    console.error("AI Generation Error:", aiError);
    return NextResponse.json({ 
      error: aiError?.message || 'AI Generation Failed',
      details: aiError?.status || '503'
    }, { status: 503 });
  }
}
