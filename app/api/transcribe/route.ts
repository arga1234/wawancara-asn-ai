// app/api/transcribe/route.ts

import { SpeechClient } from '@google-cloud/speech';
import { NextResponse } from 'next/server';

const client = new SpeechClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file not provided.' }, { status: 400 });
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const config = {
      encoding: 'LINEAR16' as const, 
      sampleRateHertz: 48000,
      languageCode: 'id-ID', 
      audioChannelCount: 1,
    };

    const audio = {
      content: audioBuffer.toString('base64'),
    };

    const speechRequest = {
      audio: audio,
      config: config,
    };

    const [response] = await client.recognize(speechRequest);
    
    const results = response.results ?? []; 

    const transcription = results
      .filter(result => result?.alternatives && result.alternatives.length > 0)
      .map(result => result!.alternatives![0].transcript)
      .join('\n');

    const finalTranscription = transcription.trim().length > 0 
      ? transcription 
      : 'Tidak ada ucapan yang terdeteksi.';

    return NextResponse.json({ transcription: finalTranscription });
  } catch (error) {
    console.error('Error during transcription:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio.' }, { status: 500 });
  }
}