"use client"
import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { NextPage } from 'next';

// PIN yang benar untuk mengakses Hasil Wawancara
const CORRECT_PIN: string = '379166';

const Home: NextPage = () => {
  const router = useRouter();
  const [pinInput, setPinInput] = useState<string>('');
  const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Handler untuk tombol 'Mulai Wawancara'
  const handleStartInterview = (): void => {
    router.push('/wawancara');
  };

  // Handler untuk tombol 'Hasil Wawancara'
  const handleShowResults = (): void => {
    setShowPinPrompt(true);
    setError('');
    setPinInput(''); 
  };

  // Handler untuk input perubahan PIN
  const handlePinChange = (e: ChangeEvent<HTMLInputElement>): void => {
    // Membatasi input hanya 6 karakter
    const value = e.target.value.slice(0, 6);
    setPinInput(value);
    if (error) {
      setError('');
    }
  };

  // Handler untuk submit PIN
  const handleSubmitPin = (e: FormEvent): void => {
    e.preventDefault();
    if (pinInput === CORRECT_PIN) {
      router.push('/hasil-wawancara');
    } else {
      setError('PIN salah. Silakan coba lagi.');
      setPinInput('');
    }
  };

  return (
    // Container utama
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      
      {/* Kartu Utama */}
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-lg text-center transform transition duration-500 hover:scale-[1.01]">
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-2">
          Aplikasi Wawancara 🚀
        </h1>
        <p className="text-gray-500 mb-8">
          Silakan pilih opsi yang tersedia untuk melanjutkan.
        </p>

        {/* Grup Tombol */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <button 
            onClick={handleStartInterview} 
            className="flex-1 px-6 py-3 text-lg font-semibold rounded-lg text-white bg-green-500 hover:bg-green-600 transition duration-300 shadow-md hover:shadow-lg"
          >
            Mulai Wawancara
          </button>
          <button 
            onClick={handleShowResults} 
            className="flex-1 px-6 py-3 text-lg font-semibold rounded-lg text-blue-600 bg-blue-100 hover:bg-blue-200 transition duration-300 border border-blue-300 shadow-sm"
          >
            Hasil Wawancara
          </button>
        </div>

        {/* Conditional Rendering: Form Input PIN */}
        {showPinPrompt && (
          <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Masukkan PIN Akses (379166)
            </h3>
            <form onSubmit={handleSubmitPin} className="space-y-4">
              <input
                type="text" // Gunakan 'text' agar bisa memantau input di handler, kemudian visualnya diatur dengan styling
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={handlePinChange}
                maxLength={6}
                placeholder="--- ---"
                className={`w-full text-center px-4 py-3 text-xl tracking-widest font-mono border-2 ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150`}
                required
              />
              {error && <p className="text-red-500 text-sm font-medium mt-1">{error}</p>}
              
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Submit
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowPinPrompt(false)} 
                  className="flex-1 px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-300"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};

export default Home;