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

  const { title, fileType, filePath } = await req.json();
  
  let extractedContent = '';
  
  if (filePath) {
    // Download from bucket
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage.from('app-files').download(filePath);
    if (!downloadError && fileBlob) {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        
        // Use Gemini to extract text from image or PDF
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
    } else {
        console.error("Failed to download from storage:", downloadError);
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
