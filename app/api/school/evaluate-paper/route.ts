import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import { ai } from '@/lib/gemini';
import { Type } from '@google/genai';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { studentId, paperId, fileData, fileType } = await req.json();
  
  const { data: paper, error: paperError } = await supabaseAdmin
    .from('papers')
    .select('*')
    .eq('id', paperId)
    .eq('school_id', session.schoolId)
    .single();

  if (paperError || !paper) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
  }

  const base64Data = fileData.split(',')[1] || fileData;

  const prompt = `
    You are an expert examiner. Correct the attached student answer script based on the following question paper and its answer key.
    
    Question Paper:
    ${JSON.stringify(paper.sections)}
    
    Rules for evaluation:
    1. Check each answer carefully against the answer key.
    2. Award marks based on accuracy and question value.
    3. Calculate total marks secured.
    4. Provide a grade (A+, A, B, C, D, F).
    5. Identify specific areas where the student is good or poor.
    6. Provide encouraging feedback.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg', data: base64Data } }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          marksSecured: { type: Type.NUMBER },
          totalMarks: { type: Type.NUMBER },
          grade: { type: Type.STRING },
          analytics: {
            type: Type.OBJECT,
            properties: {
              areasGood: { type: Type.ARRAY, items: { type: Type.STRING } },
              areasPoor: { type: Type.ARRAY, items: { type: Type.STRING } },
              feedback: { type: Type.STRING }
            }
          }
        },
        required: ['marksSecured', 'totalMarks', 'grade', 'analytics']
      }
    }
  });

  const evaluationData = JSON.parse(response.text || '{}');
  
  const { data: result, error: resultError } = await supabaseAdmin
    .from('results')
    .insert([{
      student_id: studentId,
      paper_id: paperId,
      marks_secured: evaluationData.marksSecured,
      total_marks: paper.max_marks || evaluationData.totalMarks,
      grade: evaluationData.grade,
      analytics: evaluationData.analytics
    }])
    .select()
    .single();

  if (resultError) return NextResponse.json({ error: resultError.message }, { status: 500 });
  return NextResponse.json(result);
}
