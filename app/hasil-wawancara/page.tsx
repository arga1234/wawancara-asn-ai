"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { app } from "../firebase";

export default function ResultsPage() {
  const db = getFirestore(app);
  const [results, setResults] = useState<any>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const resultsCollection = collection(db, "results");
      const querySnapshot = await getDocs(resultsCollection);
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResults(data);
    };
    fetchData();
  }, []);

  const handleViewResult = (resultString: string) => {
    try {
      const parsed = JSON.parse(resultString);
      setSelectedResult(parsed);
      setShowDialog(true);
    } catch (error) {
      alert("Format data result tidak valid");
    }
  };

  return (
    <div className="p-6">      <h2 className="text-2xl font-bold mb-4">Daftar Hasil Penilaian</h2>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nama Peserta</th>
            <th className="border p-2">Nomor Peserta</th>
            <th className="border p-2">Perangkat Daerah</th>
            <th className="border p-2">Wawancara Pada</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item: any) => (
            <tr key={item.id} className="border">
              <td className="border p-2">{item.nama}</td>
              <td className="border p-2">{item.nomor}</td>
              <td className="border p-2">{item.perangkat_daerah}</td>
              <td className="border p-2">{item.createdAt?.toDate?.().toLocaleString?.()}</td>
              <td className="border p-2 text-center">
                <button
                  className="bg-indigo-600 text-white px-3 py-1 rounded"
                  onClick={() => handleViewResult(item.result)}
                >
                  Lihat Hasil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDialog && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-2 right-2 text-red-600 font-bold"
              onClick={() => setShowDialog(false)}
            >
              X
            </button>

            <div className="mt-12 w-full max-w-2xl mx-auto p-6 rounded-lg shadow-2xl bg-white border-t-8 border-indigo-600">
              <h3 className="text-3xl font-extrabold text-indigo-800 mb-4 text-center">
                LAPORAN PENILAIAN KOMPREHENSIF
              </h3>

              <div className="flex justify-between items-center mb-6 p-4 bg-indigo-50 rounded-lg">
                <span className="text-xl font-bold text-indigo-700">Skor Total (1-100):</span>
                <span className="text-4xl font-extrabold text-indigo-900">{selectedResult.total_score}</span>
              </div>

              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-2">Komentar Umum:</h4>
              <p className="italic text-gray-700 p-3 border-l-4 border-indigo-400 bg-gray-50">{selectedResult.komentar_umum}</p>

              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-3">Analisis BerAKHLAK (1-10):</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedResult.penilaian_per_kategori).map(([key, value]: any) => (
                  <div key={key} className="p-3 border rounded-md shadow-sm bg-white">
                    <span className="font-bold block text-lg text-blue-700">{key} (Skor: {value.skor})</span>
                    <p className="text-sm text-gray-600 mt-1">{value.feedback}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-xl font-bold text-gray-800 mt-6 mb-3">Analisis Jawaban per Pertanyaan:</h4>
              {selectedResult.analisis_per_pertanyaan.map((item: any, idx: number) => (
                <div key={idx} className="mb-4 p-4 border-b border-gray-200">
                  <p className="font-bold text-gray-900">P{idx + 1}: {item.pertanyaan}</p>
                  <p className="italic text-sm text-gray-500 mt-1">Jawaban: “{item.jawaban_diterima}”</p>
                  <p className="text-sm text-gray-700 mt-2">{item.analisis_khusus}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}