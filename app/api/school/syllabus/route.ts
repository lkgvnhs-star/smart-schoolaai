import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import { ai } from '@/lib/gemini';

export async function GET() {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('syllabus')
    .select('*')
    .eq('school_id', session.schoolId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, fileType, fileData } = await req.json();
  
  let extractedContent = '';
  
  if (fileData) {
    // Use Gemini to extract text from image or PDF
    const base64Data = fileData.split(',')[1] || fileData;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "Exhaustively extract all educational content, topics, and subtopics from this document. This will be used as a syllabus to generate question papers." },
            { inlineData: { mimeType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg', data: base64Data } }
          ]
        }
      ]
    });
    extractedContent = response.text || "No content extracted";
  }

  const { data: newSyllabus, error } = await supabaseAdmin
    .from('syllabus')
    .insert([{
      school_id: session.schoolId,
      title,
      file_type: fileType,
      content: extractedContent,
      file_data: fileData
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(newSyllabus);
}
