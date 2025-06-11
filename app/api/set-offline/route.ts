import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    const supabase = createClient();

    await supabase
      .from('profiles')
      .update({ 
        is_online: false, 
        last_seen: new Date().toISOString() 
      })
      .eq('id', userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}