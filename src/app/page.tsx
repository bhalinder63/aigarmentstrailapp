"use client";

import { useState } from "react";
import ImageCapture from "@/components/ImageCapture";

export default function Home() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garmentImage, setGarmentImage] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTryOn = async () => {
    if (!personImage || !garmentImage) {
      setError("Please add both a person photo and a garment photo.");
      return;
    }
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personImage, garmentImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Try-on failed. Please try again.");
      setResultUrl(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPersonImage(null);
    setGarmentImage(null);
    setResultUrl(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">👗</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">AI Garment Trail</h1>
            <p className="text-xs text-slate-500">Virtual try-on for your shop</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!resultUrl ? (
          <>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <ImageCapture
                label="Customer Photo"
                hint="Front-facing photo of the customer"
                icon="🧍"
                onCapture={(url) => setPersonImage(url || null)}
                preview={personImage}
              />
              <ImageCapture
                label="Garment Photo"
                hint="Photo of the clothing item (shirt, pant, suit…)"
                icon="👕"
                onCapture={(url) => setGarmentImage(url || null)}
                preview={garmentImage}
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleTryOn}
              disabled={loading || !personImage || !garmentImage}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is fitting the garment… (30–60 sec)
                </>
              ) : (
                <><span>✨</span> Try It On</>
              )}
            </button>

            {loading && (
              <p className="text-center text-sm text-slate-500 mt-3">
                Our AI is virtually dressing the customer. Please wait…
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Here&apos;s how it looks!</h2>
              <p className="text-slate-500 text-sm">AI-generated virtual try-on result</p>
            </div>

            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
              <img src={resultUrl} alt="Virtual try-on result" className="w-full" />
            </div>

            <div className="flex gap-4 w-full max-w-sm">
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-500 mb-1 font-medium">Customer</p>
                <img src={personImage!} alt="Customer"
                  className="w-full rounded-xl object-cover border border-slate-200"
                  style={{ aspectRatio: "3/4" }} />
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-500 mb-1 font-medium">Garment</p>
                <img src={garmentImage!} alt="Garment"
                  className="w-full rounded-xl object-cover border border-slate-200"
                  style={{ aspectRatio: "3/4" }} />
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-sm">
              <button onClick={reset}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors">
                Try Another
              </button>
              <a href={resultUrl} download="tryon-result.jpg" target="_blank" rel="noreferrer"
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-xl transition-colors text-center">
                Download
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
