"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import ImageUploader from "@/components/ImageUploader";

const ReportDisplay = dynamic(() => import("@/components/ReportDisplay"), {
  ssr: false,
});
const ExportButtons = dynamic(() => import("@/components/ExportButtons"), {
  ssr: false,
});

interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
  type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

type AnalysisMode = "single" | "comparison";

const LOADING_STEPS = [
  "جارٍ تحليل الصورة...",
  "تطبيق معايير مونتيسوري...",
  "تقييم معايير EN 71...",
  "إعداد التقرير الاحترافي...",
];

export default function Home() {
  const [mode, setMode] = useState<AnalysisMode>("single");
  const [images, setImages] = useState<(UploadedImage | null)[]>([null, null]);
  const [toyNames, setToyNames] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [report, setReport] = useState<string>("");
  const [error, setError] = useState<string>("");
  const reportRef = useRef<HTMLDivElement>(null);

  const updateImage = (index: number, img: UploadedImage | null) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = img;
      return next;
    });
  };

  const updateToyName = (index: number, name: string) => {
    setToyNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  };

  const canAnalyze =
    mode === "single" ? !!images[0] : !!(images[0] && images[1]);

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    setError("");
    setReport("");
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    try {
      const activeImages = mode === "single" ? [images[0]!] : [images[0]!, images[1]!];

      const payload = {
        images: activeImages.map((img) => ({
          data: img.base64,
          type: img.type,
        })),
        toyNames: mode === "single" ? [toyNames[0]] : [toyNames[0], toyNames[1]],
        mode,
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ أثناء التحليل");
      }

      setReport(data.report);
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."
      );
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const primaryToyName = toyNames[0] || toyNames[1] || undefined;

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <header className="bg-montessori-green shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl select-none">🧩</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                مقيّم الألعاب التعليمية
              </h1>
              <p className="text-montessori-gold text-sm md:text-base font-medium mt-0.5">
                وفق منهج مونتيسوري ومعايير EN 71 الأوروبية
              </p>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              { icon: "🎓", text: "تقييم مونتيسوري" },
              { icon: "🛡️", text: "معايير EN 71" },
              { icon: "📊", text: "تقرير شامل" },
              { icon: "📄", text: "تصدير PDF & Word" },
              { icon: "🔄", text: "مقارنة لعبتين" },
            ].map((badge) => (
              <span
                key={badge.text}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-medium"
              >
                <span>{badge.icon}</span>
                <span>{badge.text}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Mode Selector */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-montessori-green mb-4 flex items-center gap-2">
            <span>⚙️</span>
            <span>نوع التقييم</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setMode("single")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                mode === "single"
                  ? "border-montessori-green bg-green-50 shadow-sm"
                  : "border-gray-200 hover:border-montessori-green/40 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  mode === "single"
                    ? "border-montessori-green"
                    : "border-gray-300"
                }`}
              >
                {mode === "single" && (
                  <div className="w-3 h-3 rounded-full bg-montessori-green" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">تقييم لعبة واحدة</p>
                <p className="text-sm text-gray-500">
                  تحليل شامل للعبة مع تقييم مونتيسوري وEN 71
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode("comparison")}
              className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${
                mode === "comparison"
                  ? "border-montessori-green bg-green-50 shadow-sm"
                  : "border-gray-200 hover:border-montessori-green/40 hover:bg-gray-50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  mode === "comparison"
                    ? "border-montessori-green"
                    : "border-gray-300"
                }`}
              >
                {mode === "comparison" && (
                  <div className="w-3 h-3 rounded-full bg-montessori-green" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">مقارنة لعبتين</p>
                <p className="text-sm text-gray-500">
                  تقييم ومقارنة تفصيلية بين لعبتين تعليميتين
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Image Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-montessori-green mb-5 flex items-center gap-2">
            <span>🖼️</span>
            <span>رفع صور الألعاب</span>
          </h2>

          <div
            className={`grid gap-6 ${
              mode === "comparison" ? "md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"
            }`}
          >
            <ImageUploader
              label={mode === "comparison" ? "اللعبة الأولى" : "صورة اللعبة"}
              image={images[0]}
              onImageChange={(img) => updateImage(0, img)}
              toyName={toyNames[0]}
              onToyNameChange={(name) => updateToyName(0, name)}
            />

            {mode === "comparison" && (
              <ImageUploader
                label="اللعبة الثانية"
                image={images[1]}
                onImageChange={(img) => updateImage(1, img)}
                toyName={toyNames[1]}
                onToyNameChange={(name) => updateToyName(1, name)}
              />
            )}
          </div>

          {/* Analyze Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className={`
                relative px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all
                ${
                  canAnalyze && !loading
                    ? "bg-montessori-green hover:bg-montessori-green-light hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                    : "bg-gray-300 cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>{LOADING_STEPS[loadingStep]}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🔍</span>
                  <span>
                    {mode === "comparison"
                      ? "تحليل ومقارنة اللعبتين"
                      : "تحليل وتقييم اللعبة"}
                  </span>
                </span>
              )}
            </button>
          </div>

          {!canAnalyze && !loading && (
            <p className="text-center text-sm text-gray-400 mt-3">
              {mode === "comparison"
                ? "يرجى رفع صورتي اللعبتين للمتابعة"
                : "يرجى رفع صورة اللعبة للمتابعة"}
            </p>
          )}
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-right">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <h3 className="font-bold text-red-800 mb-1">حدث خطأ</h3>
                <p className="text-red-700 text-sm">{error}</p>
                {error.includes("API") && (
                  <p className="text-red-600 text-xs mt-2 bg-red-100 rounded-lg p-2">
                    💡 تأكد من وجود ملف <code className="font-mono">.env.local</code> يحتوي على{" "}
                    <code className="font-mono">ANTHROPIC_API_KEY=your_key</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
            <div className="space-y-4">
              <div className="h-7 bg-gray-200 rounded-lg w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-4/5" />
              <div className="h-24 bg-gray-100 rounded-xl mt-4" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-32 bg-gray-100 rounded-xl mt-4" />
            </div>
            <p className="text-center text-montessori-green font-medium mt-6 animate-pulse">
              🤖 {LOADING_STEPS[loadingStep]}
            </p>
          </div>
        )}

        {/* Report */}
        {report && !loading && (
          <div ref={reportRef} className="space-y-6 animate-fade-in">
            {/* Report Header */}
            <div className="bg-montessori-green rounded-2xl p-6 text-white no-print">
              <div className="flex items-center gap-3">
                <span className="text-4xl">✅</span>
                <div>
                  <h2 className="text-xl font-bold">اكتمل التقرير بنجاح</h2>
                  <p className="text-white/80 text-sm mt-1">
                    يمكنك الاطلاع على التقرير أدناه وتصديره بالصيغة المناسبة
                  </p>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <ExportButtons report={report} toyName={primaryToyName} />

            {/* Report Content */}
            <ReportDisplay report={report} />

            {/* Bottom Export Buttons */}
            <ExportButtons report={report} toyName={primaryToyName} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white no-print">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            مقيّم الألعاب التعليمية | يعتمد على{" "}
            <span className="text-montessori-green font-medium">منهج مونتيسوري</span> و{" "}
            <span className="text-montessori-green font-medium">معايير EN 71 الأوروبية</span>
          </p>
          <p className="text-gray-400 text-xs mt-2">
            ⚠️ التقييمات مبنية على تحليل الصور ولا تغني عن الاختبارات المعملية الرسمية
          </p>
        </div>
      </footer>
    </div>
  );
}
