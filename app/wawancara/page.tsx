"use client";

import { useEffect, useState } from "react";
import InterviewContainer from "../components/InterviewContainer";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { app } from "../firebase";

export default function Home() {
  const [formData, setFormData] = useState({
    nama: "",
    nomor: "",
    perangkatDaerah: "Dinas Pendidikan",
  });

  const [isVerified, setIsVerified] = useState(false);
  const db = getFirestore(app);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const pesertaRef = collection(db, "peserta");
      const q = query(pesertaRef, where("nomor", "==", formData.nomor));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        alert("Nomor peserta tidak ditemukan!");
        return;
      }

      const pesertaDoc = querySnap.docs[0];
      const pesertaData = pesertaDoc.data();

      if (pesertaData.isBegin === true) {
        alert("Anda sudah memulai wawancara sebelumnya dan tidak bisa mengulang");
        return;
      }

      const pesertaDocRef = doc(db, "peserta", pesertaDoc.id);
      await updateDoc(pesertaDocRef, {
        isBegin: true,
      });

      localStorage.setItem("pesertaInfo", JSON.stringify({...pesertaData, perangkat_daerah: formData.perangkatDaerah}));

      setIsVerified(true);
    } catch (err) {
      console.error(err);
      alert("Kesalahan saat memvalidasi peserta!");
    }
  };

  if (isVerified) {
    return (
      <main>
        <InterviewContainer />
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow p-6 rounded-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Data Peserta Wawancara <span style={{fontSize: '12px'}}>(<span style={{color: 'red'}}>Peringatan</span>: Wawancara Hanya Bisa Dilakukan Sekali setelah klik Mulai Wawancara!)</span>
        </h2>

        <input
          type="text"
          name="nama"
          placeholder="Nama Peserta"
          value={formData.nama}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="nomor"
          placeholder="Nomor Peserta"
          value={formData.nomor}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <select
          name="perangkatDaerah"
          value={formData.perangkatDaerah}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="Dinas Pendidikan">Dinas Pendidikan</option>
          <option value="Dinas Sosial">Dinas Sosial</option>
          <option value="Dinas Kesehatan">Dinas Kesehatan</option>
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Mulai Wawancara
        </button>
      </form>
    </main>
  );
}
