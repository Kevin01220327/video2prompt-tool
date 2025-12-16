import React, { useState, useCallback, useRef } from 'react';
import { Video, Sparkles, AlertCircle, Copy, Check, UploadCloud, Film } from 'lucide-react';
import { generatePromptFromVideo } from './services/geminiService';
import { Button } from './components/Button';
import { LoadingSpinner } from './components/LoadingSpinner';

const MAX_FILE_SIZE_MB = 18; // Limit to ~18MB to be safe with browser memory/limits for inline base64

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // File handling
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError(null);
    setResult('');

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('video/')) {
      setError('Please upload a valid video file.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Video is too large. Please use a clip smaller than ${MAX_FILE_SIZE_MB}MB for this demo.`);
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
  };

  // Generate Prompt Action
  const handleGenerate = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setResult('');

    try {
      const promptText = await generatePromptFromVideo(file);
      setResult(promptText);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const clearState = () => {
    setFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setResult('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Film size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Video2Prompt
            </h1>
          </div>
          <a 
            href="#" 
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Powered by Gemini 2.5 Flash
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Input */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">Turn Video into Text</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Upload a short video clip to generate a highly detailed prompt. 
                Perfect for Midjourney, Runway, or Sora workflows.
              </p>
            </div>

            {/* Upload Area */}
            <div className={`
              relative group border-2 border-dashed rounded-2xl transition-all duration-300
              ${file 
                ? 'border-indigo-500/50 bg-indigo-500/5' 
                : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50 bg-slate-900'
              }
            `}>
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-64 cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                    <UploadCloud className="text-indigo-400" size={32} />
                  </div>
                  <span className="text-lg font-medium text-slate-200">Click to upload video</span>
                  <span className="text-sm text-slate-500 mt-2">MP4, MOV, WebM (Max {MAX_FILE_SIZE_MB}MB)</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="video/*" 
                    onChange={handleFileChange} 
                  />
                </label>
              ) : (
                <div className="p-4">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-2xl">
                    <video 
                      src={videoUrl || ''} 
                      className="w-full h-full object-contain" 
                      controls 
                    />
                    <button 
                      onClick={clearState}
                      className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full backdrop-blur-sm transition-colors"
                      title="Remove video"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                     <div className="text-sm text-slate-400 truncate max-w-[200px]">
                       {file.name}
                     </div>
                     <span className="text-xs font-mono text-slate-500 px-2 py-1 rounded bg-slate-800 border border-slate-700">
                       {(file.size / (1024 * 1024)).toFixed(1)} MB
                     </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 animate-fade-in">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button 
              onClick={handleGenerate} 
              disabled={!file || isAnalyzing}
              className="w-full h-14 text-lg shadow-lg shadow-indigo-500/25"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  <span>Analyzing Frames...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles size={20} />
                  <span>Generate Prompt</span>
                </div>
              )}
            </Button>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col h-full min-h-[400px]">
            <div className="relative flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <h3 className="font-medium text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  AI Analysis Result
                </h3>
                {result && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20"
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    {isCopied ? 'Copied!' : 'Copy Text'}
                  </button>
                )}
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6 text-slate-500 animate-pulse">
                     <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                        <Video size={32} className="opacity-50" />
                     </div>
                     <p className="text-sm font-medium">Extracting visual details & creating prompt...</p>
                  </div>
                ) : result ? (
                  <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed max-w-none">
                     <p className="whitespace-pre-wrap text-lg">{result}</p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                      <Film size={40} className="opacity-20" />
                    </div>
                    <p className="text-sm">Result will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}