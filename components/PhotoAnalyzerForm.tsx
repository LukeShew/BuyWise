"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, ImagePlus, Loader2, Upload, X } from "lucide-react";

import { DealScoreCard } from "@/components/DealScoreCard";
import type { PhotoAnalysisApiResponse } from "@/types";

const MAX_FILES = 6;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isAcceptedImage(file: File) {
  return acceptedTypes.includes(file.type);
}

export function PhotoAnalyzerForm() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [manualPrice, setManualPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<PhotoAnalysisApiResponse | null>(null);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file)
      })),
    [files]
  );

  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  function addFiles(nextFiles: File[]) {
    setError("");
    const images = nextFiles.filter(isAcceptedImage);
    const rejected = nextFiles.length - images.length;

    if (rejected > 0) {
      setError("Only image files are allowed.");
    }

    setFiles((current) => [...current, ...images].slice(0, MAX_FILES));
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  async function analyzePhotos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResponse(null);

    if (files.length === 0) {
      setError("Upload at least one product, listing, checkout, or sale photo.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    if (manualPrice.trim()) {
      formData.append("manualPrice", manualPrice.trim());
    }
    if (notes.trim()) {
      formData.append("notes", notes.trim());
    }

    setIsAnalyzing(true);
    try {
      const result = await fetch("/api/analyze-photos", {
        method: "POST",
        body: formData
      });
      const data = (await result.json()) as PhotoAnalysisApiResponse;
      setResponse(data);

      if (!data.ok) {
        setError(data.message);
      } else {
        setMessage(data.published ? "Photo analyzed and added to Search for 24 hours." : data.message);
      }
    } catch {
      setError("Photo analysis failed. Try again with clearer screenshots or product photos.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (response?.ok && response.result) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setResponse(null)}
          className="focus-ring rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-700 hover:border-mint hover:text-ink"
        >
          Analyze another photo
        </button>
        <DealScoreCard result={response.result} context={response.context} />
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
          <Camera className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-mint">Photo analyzer</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-ink">Upload photos of the listing or product</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Upload marketplace screenshots, retail pages, checkout screens, or product sale photos. BuyWise will reject photos that do not look like something for sale.
          </p>
        </div>
      </div>

      <form onSubmit={analyzePhotos} className="mt-6 space-y-5">
        <div
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
            dragActive ? "border-mint bg-emerald-50" : "border-stone-300 bg-stone-50"
          }`}
        >
          <ImagePlus className="mx-auto h-10 w-10 text-mint" aria-hidden />
          <h3 className="mt-3 text-lg font-black text-ink">Drag and drop photos here</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-stone-600">
            Add up to {MAX_FILES} images. Clear screenshots work best, especially if price, title, source, and condition are visible.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-4 font-bold text-white hover:bg-stone-800"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload photos
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="focus-ring inline-flex h-11 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 font-bold text-ink hover:border-mint"
            >
              <Camera className="h-4 w-4" aria-hidden />
              Take photo
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
        </div>

        {previews.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((preview, index) => (
              <div key={`${preview.file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.url} alt="" className="h-44 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label="Remove photo"
                  className="focus-ring absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-700 shadow-sm hover:text-danger"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
                <p className="truncate px-3 py-2 text-xs font-semibold text-stone-600">{preview.file.name}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[0.5fr_1fr]">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Price, if you know it</span>
            <input
              value={manualPrice}
              onChange={(event) => setManualPrice(event.target.value)}
              inputMode="decimal"
              placeholder="800"
              className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink placeholder:text-stone-500"
            />
            <p className="mt-1 text-xs leading-5 text-stone-500">If you enter it, BuyWise treats this price as confirmed.</p>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Extra notes</span>
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: seller says it includes charger, open box, no receipt..."
              className="focus-ring mt-2 h-12 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 text-ink placeholder:text-stone-500"
            />
          </label>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="leading-6">{error}</p>
          </div>
        ) : null}
        {message ? (
          <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="leading-6">{message}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isAnalyzing}
          className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Analyzing photos
            </>
          ) : (
            "Analyze photos"
          )}
        </button>
      </form>
    </section>
  );
}
