import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/auth';
import { ai } from '@/lib/gemini';

import { withRetry } from '@/lib/ai-retry';

export async function GET() {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('syllabus')
      .select('*')
      .eq('school_id', session.schoolId)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Fetch failed" }, { status: 500 });
  }
}

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
  const { title, fileType, filePath } = body;
  
  let extractedContent = '';
  
  if (filePath) {
    // Download from bucket
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage.from('app-files').download(filePath);
    if (!downloadError && fileBlob) {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        // Use Gemini to extract text from image or PDF
        try {
          const response = await withRetry(() => ai.models.generateContent({
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
          }));
          extractedContent = response.text || "No content extracted";
        } catch (aiError: any) {
          console.error("AI Extraction Error:", aiError);
          return NextResponse.json({ error: "AI high demand, please try again in a few minutes.", details: aiError.status }, { status: 503 });
        }
    } else {
        console.error("Failed to download from storage:", downloadError);
        return NextResponse.json({ error: "Failed to download file for processing" }, { status: 400 });
    }
  }

  const { data: newSyllabus, error } = await supabaseAdmin
    .from('syllabus')
    .insert([{
      school_id: session.schoolId,
      title,
      file_type: fileType,
      content: extractedContent,
      file_data: filePath
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(newSyllabus);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.schoolId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const { error } = await supabaseAdmin
    .from('syllabus')
    .delete()
    .eq('id', id)
    .eq('school_id', session.schoolId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
