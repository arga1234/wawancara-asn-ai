import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import { app } from "../../firebase";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({});

type QuestionAnswer = {
    question: string;
    answer: string;
    index: number;
};

export async function POST(request: Request) {
    try {
        const db = getFirestore(app);
        const { results } = await request.json();

        if (!results.data || !Array.isArray(results.data) || results.data.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid interview results.' }, { status: 400 });
        }

        const formattedTranscript = results.data.map((item: QuestionAnswer) => 
            `P${item.index + 1}: ${item.question}\nJawaban: ${item.answer}\n---\n`
        ).join('\n');
        
        const systemInstruction = `Anda adalah Penilai Kinerja ASN ahli yang memberikan laporan terperinci. 
        Nilailah kandidat berdasarkan Relevansi dan tempat dinasnya di ${results.pesertaInfo.perangkat_daerah}, Komitmen Pelayanan Publik, dan Konsistensi dengan Nilai BERAKHLAK (Berorientasi Pelayanan, Akuntabel, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif).
        Berikan respons dalam format JSON STRICTLY dengan struktur berikut:
        - "total_score" (integer, 1-100)
        - "komentar_umum" (string, Ringkasan performa keseluruhan.)
        - "penilaian_per_kategori" (object dengan key: 'Berorientasi Pelayanan', 'Akuntabel', 'Kompeten', 'Harmonis', 'Loyal', 'Adaptif', 'Kolaboratif')
            - Setiap kategori memiliki properti: "skor" (integer, 1-10), "feedback" (string, analisis bagaimana nilai itu tercermin dari seluruh jawaban).
        - "analisis_per_pertanyaan" (array of objects)
            - Properti: "pertanyaan" (string), "jawaban_diterima" (string), "analisis_khusus" (string, analisis fokus jawaban P1, P2, P3, P4).`;
        
        const userPrompt = `LAPORAN WAWANCARA LENGKAP:\n\n${formattedTranscript}\n\nTugas: Lakukan penilaian komprehensif, pastikan semua kategori BERAKHLAK dinilai dan berikan skor 1-10 untuk setiap kategori.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });

        if (!response.text) {
             throw new Error("Gemini did not return any text content. Generation might be blocked by safety filters.");
        }
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        await addDoc(collection(db, "results"), {
            nama: results.pesertaInfo.nama ?? "",
            nomor: results.pesertaInfo.nomor ?? "",
            perangkat_daerah:results.pesertaInfo.perangkat_daerah ?? "",
            result: jsonText, // langsung simpan JSON parsed
            createdAt: serverTimestamp(),
        });

        return NextResponse.json({
            success: true,
            report: result,
        });

    } catch (error) {
        console.error('Error during Gemini final report generation:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to generate final report using Gemini.',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}