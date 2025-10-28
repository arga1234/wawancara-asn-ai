
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';

const ttsClient = new TextToSpeechClient();

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter.' }, { status: 400 });
    }

    const ttsRequest = {
      input: { text },
      voice: { 
        languageCode: 'id-ID', 
        name: 'id-ID-Wavenet-D',
      },
      audioConfig: { 
        audioEncoding: 'MP3' as const, 
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(ttsRequest);
    
    if (!response.audioContent) {
        throw new Error("TTS API returned no audio content.");
    }

    const audioContentBase64 = response.audioContent.toString('base64');

    return NextResponse.json({ audioBase64: audioContentBase64 });

  } catch (error) {
    console.error('Error during TTS synthesis:', error);
    return NextResponse.json({ 
        error: 'Failed to synthesize speech.',
        details: error instanceof Error ? error.message : 'Unknown TTS error'
    }, { status: 500 });
  }
}