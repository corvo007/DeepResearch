import React, { useState } from 'react';
import { ImageSize, Language } from '../types';
import { generateTimelineImage } from '../services/geminiService';
import { ImageIcon, Loader2, Sparkles } from './Icons';

interface TimelineSectionProps {
  visualPrompt: string;
  topic: string;
  imageUrl: string | null;
  onImageGenerated: (url: string) => void;
  language: Language;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ visualPrompt, topic, imageUrl, onImageGenerated, language }) => {
  const [size, setSize] = useState<ImageSize>('2K');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await generateTimelineImage(visualPrompt, size, language);
      onImageGenerated(url);
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Ensure you have selected a paid API key project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative print:p-0 print:bg-none print:text-black print:shadow-none">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 print:text-slate-900">
              <ImageIcon className="text-purple-400 print:text-slate-600" />
              Visual Timeline
            </h2>
            <p className="text-slate-400 text-sm mt-1 print:text-slate-500">
              Generated using Gemini Nano Banana Pro (Pro Image Preview).
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 print:hidden">
            <span className="text-sm text-slate-400 pl-2">Size:</span>
            {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  size === s 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {!imageUrl && !loading && (
           <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-800/20 print:hidden">
             <Sparkles className="w-12 h-12 text-purple-400 mb-4 opacity-50" />
             <p className="text-slate-300 max-w-lg mb-6">
               Ready to visualize the history of <strong>{topic}</strong>. 
               Gemini will generate a professional infographic timeline based on the research summary.
             </p>
             <button
              onClick={handleGenerate}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
            >
              Generate Timeline
            </button>
            {error && (
              <p className="mt-4 text-red-400 bg-red-900/20 px-4 py-2 rounded text-sm">
                {error}
              </p>
            )}
           </div>
        )}

        {loading && (
          <div className="h-96 flex flex-col items-center justify-center border border-slate-700 rounded-xl bg-slate-800/30 print:hidden">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <p className="text-slate-300 font-medium animate-pulse">Designing timeline...</p>
            <p className="text-slate-500 text-sm mt-2">Using Gemini 3 Pro Image Preview</p>
          </div>
        )}

        {imageUrl && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl print:shadow-none print:border-0">
              <img src={imageUrl} alt={`Timeline of ${topic}`} className="w-full h-auto" />
            </div>
            <div className="flex justify-end print:hidden">
              <button 
                onClick={handleGenerate} 
                className="text-sm text-slate-400 hover:text-white flex items-center gap-2"
              >
                <Sparkles size={14} /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Background Decor - hidden in print */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none print:hidden"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none print:hidden"></div>
    </div>
  );
};