
import { useState, useRef, useEffect } from 'react';
import { getWaveBlob } from 'webm-to-wav-converter';

export async function convertWebmToWav(webmBlob: Blob): Promise<Blob> {
  try {
    const wavBlob: Blob = await getWaveBlob(webmBlob, false);
    return wavBlob;
  } catch (error) {
    console.error("Failed to convert WebM to WAV:", error);
    throw error;
  }
}

interface AudioRecorderState {
  isRecording: boolean;
  audioBlob: Blob | null;
  startRecording: () => void;
  stopRecording: () => void;
  recordingError: string | null;
}

export const useAudioRecorder = (): AudioRecorderState => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const cleanup = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };

    return () => {
      cleanup();
    };
  }, []);

  const startRecording = async () => {
    setRecordingError(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);

    } catch (error) {
      console.error("Gagal mengakses mikrofon:", error);
      setRecordingError("Izin mikrofon ditolak atau tidak tersedia. Pastikan mikrofon aktif.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const wavBlob = await getWaveBlob(blob, false);
        setAudioBlob(wavBlob);
        
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        audioChunksRef.current = [];
      };
    }
  };

  return { isRecording, audioBlob, startRecording, stopRecording, recordingError };
};