/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useState } from 'react';
import { useAudioRecorder } from './useAudioRecorder'; // Pastikan path benar

type InterviewStatus = 'READY' | 'AI_SPEAKING' | 'USER_RECORDING' | 'PROCESSING' | 'PROCESSED_WAITING' | 'DONE_REPORT';

type InterviewResult = {
  question: string;
  answer: string;
  index: number;
};

type FinalReport = {
    total_score: number;
    komentar_umum: string;
    
    penilaian_per_kategori: {
        'Berorientasi Pelayanan': { skor: number, feedback: string };
        'Akuntabel': { skor: number, feedback: string };
        'Kompeten': { skor: number, feedback: string };
        'Harmonis': { skor: number, feedback: string };
        'Loyal': { skor: number, feedback: string };
        'Adaptif': { skor: number, feedback: string };
        'Kolaboratif': { skor: number, feedback: string };
    };

    analisis_per_pertanyaan: Array<{
        pertanyaan: string; 
        jawaban_diterima: string; 
        analisis_khusus: string; 
    }>;
} | null;

const mockQuestions: string[] = [
  "Selamat datang. Tolong sebutkan nama dan motivasi utama Anda melamar sebagai ASN.",
  "Menurut Anda, apa tantangan terbesar ASN saat ini dan bagaimana Anda akan menghadapinya?",
  "Jelaskan situasi di mana Anda harus membuat keputusan sulit di bawah tekanan.",
  "Apa yang Anda ketahui tentang nilai-nilai dasar ASN (BerAKHLAK)?",
];



const InterviewContainer = () => {
  const [resultsHistory, setResultsHistory] = useState<InterviewResult[]>([]); 
  const [finalReport, setFinalReport] = useState<FinalReport>(null);
  const [status, setStatus] = useState<InterviewStatus>('READY');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [questionAudio, setQuestionAudio] = useState<HTMLAudioElement | null>(null);
  const totalQuestions = mockQuestions.length;

  const { 
    isRecording, 
    audioBlob, 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording,
    recordingError
  } = useAudioRecorder();

  const currentQuestion = mockQuestions[currentQuestionIndex];

const playQuestionAudio = async (questionText: string) => {
    setStatus('AI_SPEAKING');

    try {
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: questionText }),
        });

        if (!response.ok) throw new Error('Gagal mendapatkan audio dari TTS API.');

        const data = await response.json();
        const audioBase64 = data.audioBase64;

        if (!audioBase64) throw new Error('Audio content is empty.');

        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        setQuestionAudio(audio); 

        audio.onended = () => {
            startAudioRecording();
            setStatus('USER_RECORDING');
            setTranscript(null);
            setQuestionAudio(null);
        };

        // 4. Putar Audio
        audio.play().catch(e => {
            console.error("Gagal play audio (interaksi user diperlukan):", e);
            alert("Browser memblokir auto-play. Tekan OK untuk merekam jawaban.");
            startAudioRecording();
            setStatus('USER_RECORDING');
        });

    } catch (error) {
        console.error('TTS Playback Error:', error);
        alert("TTS gagal. Mulai rekaman jawaban sekarang.");
        startAudioRecording();
        setStatus('USER_RECORDING');
    }
};

  const startInterview = () => {
    if (status === 'READY') {
      playQuestionAudio(currentQuestion);
    }
  };

  const stopRecording = () => {
    if (status === 'USER_RECORDING') {
      setStatus('PROCESSING'); 
      
      stopAudioRecording(); 
    }
  };
  
  const continueToNextQuestion = () => {
    if (status === 'PROCESSED_WAITING') {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < totalQuestions) {
            setCurrentQuestionIndex(nextIndex); 
            playQuestionAudio(mockQuestions[nextIndex]);
        }
    }
  };
  


useEffect(() => {
    const processAudio = async (blob: Blob, currentQ: string) => {
        setStatus('PROCESSING');
        
        const formData = new FormData();
        formData.append('audio', blob, 'jawaban.webm');

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Gagal menghubungi server transkripsi.');
            }

            const data = await response.json();
            const transcribedText = data.transcription || 'Tidak ada transkripsi yang diterima.';

            setTranscript(`Transkripsi: "${transcribedText}"`);

            const currentResult: InterviewResult = {
                question: currentQ,
                answer: transcribedText,
                index: currentQuestionIndex,
            };

            const updatedHistory = [...resultsHistory, currentResult];
            setResultsHistory(updatedHistory);

            const nextIndex = currentQuestionIndex + 1;
            if (nextIndex >= totalQuestions) {
        
        try {
            const reportResponse = await fetch('/api/final-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: updatedHistory }),
            });

            if (!reportResponse.ok) throw new Error('Failed to fetch final report.');
            
            const reportData = await reportResponse.json();

            if (reportData.success && reportData.report) {
                setFinalReport(reportData.report as FinalReport);
                setStatus('DONE_REPORT'); 
            } else {
                throw new Error(reportData.error || 'Penilaian Final Gagal.');
            }

        } catch (error) {
            console.error('Proses Penilaian Final Gagal:', error);
            setTranscript(prev => `${prev}\n\n[ERROR LAPORAN AKHIR]: Gagal menghubungi atau memproses Gemini.`);
            setStatus('DONE_REPORT');
        }

    } else {
        setStatus('PROCESSED_WAITING'); 
    }

        } catch (error) {
            console.error('Proses STT Gagal:', error);
            setTranscript('ERROR: Gagal memproses audio. Cek konsol server dan kredensial.');
            setStatus('PROCESSED_WAITING'); 
        }
    };
    
    if (audioBlob && status === 'PROCESSING') {
        processAudio(audioBlob, mockQuestions[currentQuestionIndex]);
    }
}, [audioBlob, status, currentQuestionIndex, totalQuestions]);

  const handleAction = () => {
    if (status === 'READY') {
      startInterview();
    } else if (status === 'USER_RECORDING') {
      stopRecording();
    } else if (status === 'PROCESSED_WAITING') {
        continueToNextQuestion();
    } else if (status === 'DONE_REPORT') {
        setCurrentQuestionIndex(0);
        setResultsHistory([]);
        setFinalReport(null);
        setStatus('READY');
    }
  };

  let buttonText = 'Mulai Wawancara';
  let buttonColor = 'bg-blue-600 hover:bg-blue-700';
  let mainMessage = 'Tekan tombol di bawah untuk memulai wawancara ASN dengan AI.';

  if (status === 'AI_SPEAKING') {
    buttonText = 'AI Sedang Bertanya...';
    buttonColor = 'bg-gray-400 cursor-not-allowed';
    mainMessage = mockQuestions[currentQuestionIndex];
  } else if (status === 'USER_RECORDING') {
    buttonText = 'Selesai Bicara';
    buttonColor = 'bg-red-600 hover:bg-red-700 animate-pulse';
    mainMessage = 'ANDA SEDANG MENJAWAB. Fokuslah pada jawaban Anda.';
  } else if (status === 'PROCESSING') {
    buttonText = 'Menganalisis Jawaban...';
    buttonColor = 'bg-yellow-600 cursor-not-allowed';
    mainMessage = 'Jawaban Anda sedang diproses oleh sistem AI.';
  } else if (status === 'PROCESSED_WAITING') {
    buttonText = `Lanjutkan ke Pertanyaan ${currentQuestionIndex + 2}`;
    buttonColor = 'bg-green-600 hover:bg-green-700';
    mainMessage = 'Penilaian Selesai. Tekan tombol untuk melanjutkan ke pertanyaan berikutnya.';
  } else if (status === 'DONE_REPORT') {
    buttonText = 'Selesai & Mulai Wawancara Baru';
    buttonColor = 'bg-blue-600 hover:bg-blue-700';
    mainMessage = 'Wawancara telah selesai. Silakan tinjau laporan akhir.';
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      
      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Wawancara AI ASN</h1>
        {status !== 'READY' && (
          <p className="text-xl text-gray-600 mt-2">
            {/* Indeks pertanyaan + 1 karena array dimulai dari 0 */}
            Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
          </p>
        )}
      </div>

      {recordingError && (
          <div className="w-full max-w-2xl p-4 mb-4 text-center bg-red-100 text-red-700 rounded-lg">
            {recordingError}
          </div>
      )}

      <div className={`w-full max-w-2xl p-8 rounded-lg shadow-xl mb-12 transition-all duration-500
        ${status === 'USER_RECORDING' ? 'bg-red-50 ring-4 ring-red-300' : 'bg-white'}`}>
        <p className={`text-center font-semibold 
          ${status === 'USER_RECORDING' ? 'text-red-700 text-2xl' : 'text-gray-700 text-xl'}`}
        >
          {mainMessage}
        </p>
      </div>

      <button
        onClick={handleAction}
        disabled={status === 'AI_SPEAKING' || status === 'PROCESSING'}
        className={`w-64 h-20 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg 
          transition-colors duration-300 transform hover:scale-105 
          ${buttonColor}`}
      >
        {/* Spinner hanya tampil saat Processing */}
        {status === 'PROCESSING' && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {buttonText}
      </button>

      {audioBlob && status !== 'READY' && (
      <div className="mt-12 w-full max-w-2xl p-4 bg-gray-100 rounded-lg border border-gray-300">
        <h3 className="font-semibold text-gray-700 mb-2">Audio Rekaman:</h3>
        <p className="text-gray-600 italic">Format: {audioBlob.type}, Ukuran: {audioBlob.size} bytes.</p>
        {/* Menampilkan audio player untuk menguji rekaman */}
        <audio controls src={URL.createObjectURL(audioBlob)} className="mt-2 w-full"></audio>
        <p className="mt-2 text-sm text-green-600 font-semibold">{transcript}</p>
      </div>
    )}
      
      <p className="mt-8 text-sm text-gray-400">Status Saat Ini: {status}</p>

      {status === 'DONE_REPORT' && finalReport && (
          <div className="mt-12 w-full max-w-2xl p-6 rounded-lg shadow-2xl bg-white border-t-8 border-indigo-600">
              <h3 className="text-3xl font-extrabold text-indigo-800 mb-4 text-center">
                  LAPORAN PENILAIAN KOMPREHENSIF
              </h3>
              
              <div className="flex justify-between items-center mb-6 p-4 bg-indigo-50 rounded-lg">
                  <span className="text-xl font-bold text-indigo-700">Skor Total (1-100):</span>
                  <span className="text-4xl font-extrabold text-indigo-900">{finalReport.total_score}</span>
              </div>

              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-2">Komentar Umum:</h4>
              <p className="italic text-gray-700 p-3 border-l-4 border-indigo-400 bg-gray-50">{finalReport.komentar_umum}</p>

              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-3">Analisis BerAKHLAK (1-10):</h4>
              <div className="grid grid-cols-2 gap-4">
                  {Object.entries(finalReport.penilaian_per_kategori).map(([key, value]: any) => (
                      <div key={key} className="p-3 border rounded-md shadow-sm bg-white">
                          <span className="font-bold block text-lg text-blue-700">{key} (Skor: {value.skor})</span>
                          <p className="text-sm text-gray-600 mt-1">{value.feedback}</p>
                      </div>
                  ))}
              </div>
              
              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-3">Analisis Jawaban per Pertanyaan:</h4>
              {finalReport.analisis_per_pertanyaan.map((item: any, idx: number) => (
                  <div key={idx} className="mb-4 p-4 border-b border-gray-200">
                      <p className="font-bold text-gray-900">P{idx + 1}: {item.pertanyaan}</p>
                      <p className="italic text-sm text-gray-500 mt-1">Jawaban: &rdquo;{item.jawaban_diterima}&rdquo;</p>
                      <p className="text-sm text-gray-700 mt-2">{item.analisis_khusus}</p>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default InterviewContainer;