import React, { useState, useEffect } from 'react';
import { researchTopic } from './services/geminiService';
import { ResearchResult, ResearchConfig, ResearchFocus, ArticleCount, Language, HistoryItem } from './types';
import { ArticleCard } from './components/ArticleCard';
import { TimelineSection } from './components/TimelineSection';
import { ChatWidget } from './components/ChatWidget';
import { Search, Cpu, Loader2, SlidersHorizontal, FileText, History } from './components/Icons';
import { HistorySidebar } from './components/HistorySidebar';
import { LiteratureReviewSection } from './components/LiteratureReviewSection';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ResearchConfig>({ focus: 'balanced', count: 10, language: 'en' });
  const [showSettings, setShowSettings] = useState(false);
  const [timelineImage, setTimelineImage] = useState<string | null>(null);
  const [literatureReview, setLiteratureReview] = useState<string | null>(null);
  
  // History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [currentResearchId, setCurrentResearchId] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('deep_research_history');
    if (savedHistory) {
      try {
        setHistoryItems(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (newItem: HistoryItem) => {
    const updatedHistory = [newItem, ...historyItems].slice(0, 15); // Keep last 15 items
    setHistoryItems(updatedHistory);
    try {
      localStorage.setItem('deep_research_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("LocalStorage full, could not save history");
    }
  };

  const updateHistoryItem = (id: string, updates: Partial<HistoryItem>) => {
    const updatedHistory = historyItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    setHistoryItems(updatedHistory);
    try {
      localStorage.setItem('deep_research_history', JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("LocalStorage full, could not save history updates");
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = historyItems.filter(item => item.id !== id);
    setHistoryItems(updatedHistory);
    localStorage.setItem('deep_research_history', JSON.stringify(updatedHistory));
    
    if (currentResearchId === id) {
      setResult(null);
      setTimelineImage(null);
      setLiteratureReview(null);
      setCurrentResearchId(null);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistoryItems([]);
      localStorage.removeItem('deep_research_history');
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setQuery(item.topic);
    setResult(item.result);
    setTimelineImage(item.timelineImage);
    setLiteratureReview(item.literatureReview || null);
    setConfig(item.config);
    setCurrentResearchId(item.id);
    setHistoryOpen(false);
    setShowSettings(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setTimelineImage(null); // Reset timeline
    setLiteratureReview(null); // Reset review
    setShowSettings(false); // Collapse settings on search
    setCurrentResearchId(null);

    try {
      const data = await researchTopic(query, config);
      setResult(data);
      
      // Save to history
      const newId = Date.now().toString();
      const newItem: HistoryItem = {
        id: newId,
        timestamp: Date.now(),
        topic: query,
        result: data,
        timelineImage: null,
        literatureReview: null,
        config: config
      };
      setCurrentResearchId(newId);
      saveToHistory(newItem);

    } catch (err: any) {
      setError("Failed to research topic. Please check your API key and try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTimelineGenerated = (url: string) => {
    setTimelineImage(url);
    if (currentResearchId) {
      updateHistoryItem(currentResearchId, { timelineImage: url });
    }
  };

  const handleReviewGenerated = (review: string) => {
    setLiteratureReview(review);
    if (currentResearchId) {
       updateHistoryItem(currentResearchId, { literatureReview: review });
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;

    const date = new Date().toLocaleString();
    let content = `# DeepResearch: ${result.topic}\n`;
    content += `*Generated by Gemini 3 Pro on ${date}*\n\n`;

    content += `## Development Summary\n`;
    content += `> ${result.summary.replace(/\n/g, '\n> ')}\n\n`;

    if (timelineImage) {
      content += `## Visual Timeline\n`;
      // Embed base64 image directly in markdown
      content += `![Timeline of ${result.topic}](${timelineImage})\n\n`;
    }

    if (literatureReview) {
      content += `## Literature Review\n\n`;
      content += `${literatureReview}\n\n`;
    }

    content += `## Seminal & Important Articles\n\n`;
    result.articles.forEach((article, index) => {
      content += `### ${index + 1}. ${article.title}\n`;
      content += `*${article.authors}*`;
      if (article.publication_date) {
        content += ` • **${article.publication_date}**`;
      }
      content += `\n\n`;
      
      if (article.url) {
        content += `[Read Full Paper](${article.url})\n\n`;
      }
      content += `**Significance**\n${article.significance}\n\n`;
      content += `**AI Summary**\n${article.ai_summary}\n\n`;
      content += `---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DeepResearch-${result.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Cpu size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">DeepResearch.AI</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {result && (
              <button 
                onClick={handleExportMarkdown}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Export as Markdown"
              >
                 <FileText size={18} />
                 <span className="hidden sm:inline">Export</span>
              </button>
            )}
            
            <button 
              onClick={() => setHistoryOpen(true)}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-slate-200"
              title="History"
            >
              <History size={18} />
              <span className="hidden sm:inline">History</span>
            </button>

            <div className="text-xs font-medium px-3 py-1 bg-slate-100 rounded-full text-slate-500 hidden md:block">
              Gemini 3 Pro
            </div>
          </div>
        </div>
      </header>

      <HistorySidebar 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)}
        historyItems={historyItems}
        onSelect={loadHistoryItem}
        onDelete={deleteHistoryItem}
        onClear={clearHistory}
      />

      <main className="max-w-6xl mx-auto px-4 mt-12 print:mt-4 print:max-w-none">
        
        {/* Search Hero - Hidden when printing */}
        <div className={`transition-all duration-500 print:hidden ${result ? 'mb-12' : 'min-h-[60vh] flex flex-col justify-center items-center'}`}>
          <div className={`w-full ${result ? '' : 'text-center space-y-6'}`}>
            {!result && (
              <>
                <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
                  Explore the History <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">of Knowledge</span>
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Enter a scientific concept or field. We'll retrieve seminal papers, summarize the evolution, and visualize the timeline using Gemini Thinking & Vision models.
                </p>
              </>
            )}

            <div className={`relative max-w-2xl mx-auto w-full ${result ? '' : 'mt-8'}`}>
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Attention Mechanism, CRISPR, Quantum Computing..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg"
                  disabled={isSearching}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:bg-slate-300 flex items-center justify-center"
                >
                  {isSearching ? <Loader2 className="animate-spin" /> : 'Research'}
                </button>
              </form>

              {/* Settings Toggle */}
              <div className="mt-4 flex flex-col items-center">
                <button 
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors mb-2"
                >
                    <SlidersHorizontal size={16} />
                    <span>Configuration</span>
                </button>
                
                <div className={`
                    w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out
                    ${showSettings ? 'max-h-[800px] opacity-100 p-5' : 'max-h-0 opacity-0 p-0 border-0'}
                `}>
                    <div className="flex flex-col sm:flex-row justify-center gap-8 flex-wrap">
                        
                        {/* Language Selection */}
                         <div className="flex flex-col gap-3 items-center sm:items-start">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Language</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {[
                                  {id: 'en', label: 'English'},
                                  {id: 'zh', label: '中文'},
                                  {id: 'ja', label: '日本語'}
                                ].map(lang => (
                                    <button
                                        key={lang.id}
                                        type="button"
                                        onClick={() => setConfig({...config, language: lang.id as Language})}
                                        className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                                            config.language === lang.id 
                                            ? 'bg-white text-blue-600 shadow-sm font-medium' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Focus Selection */}
                        <div className="flex flex-col gap-3 items-center sm:items-start">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preference</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {(['classic', 'balanced', 'recent'] as ResearchFocus[]).map(mode => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setConfig({...config, focus: mode})}
                                        className={`px-4 py-1.5 text-sm rounded-md capitalize transition-all ${
                                            config.focus === mode 
                                            ? 'bg-white text-blue-600 shadow-sm font-medium' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Count Selection */}
                        <div className="flex flex-col gap-3 items-center sm:items-start">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citations</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {([10, 20, 30] as ArticleCount[]).map(num => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setConfig({...config, count: num})}
                                        className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                                            config.count === num 
                                            ? 'bg-white text-blue-600 shadow-sm font-medium' 
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-4 text-xs text-slate-400">
                      {config.focus === 'classic' && "Focusing on historical foundational papers."}
                      {config.focus === 'recent' && "Focusing on breakthroughs from 2020-2025."}
                      {config.focus === 'balanced' && "Mixing foundational classics with modern breakthroughs."}
                    </div>
                </div>
              </div>

              {isSearching && (
                 <div className="absolute -bottom-10 left-0 w-full text-center">
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2 animate-pulse">
                      <Cpu size={14} /> Gemini 3 Pro is researching...
                    </p>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg mb-8 text-center print:hidden">
            {error}
          </div>
        )}

        {/* Results Section - Wrapped for PDF Generation */}
        {result && (
          <div id="research-report" className="space-y-12 animate-fade-in print:space-y-6">
            
            {/* Header for Print/PDF only */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-slate-900">DeepResearch: {result.topic}</h1>
                <p className="text-sm text-slate-500 mt-2">Generated by Gemini 3 Pro • {new Date().toLocaleDateString()}</p>
            </div>

            {/* Summary */}
            <section className="break-inside-avoid">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Development Summary</h2>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm prose prose-slate max-w-none print:border-0 print:shadow-none print:p-0">
                 <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
                   {result.summary}
                 </p>
              </div>
            </section>

            {/* Timeline Generator */}
            {/* If timelineImage exists, show it. If not, only show generator in web view, hide in print if empty */}
            <section className={`${!timelineImage ? 'print:hidden' : 'break-inside-avoid'}`}>
              <TimelineSection 
                visualPrompt={result.suggestedVisualPrompt} 
                topic={result.topic} 
                imageUrl={timelineImage}
                onImageGenerated={handleTimelineGenerated}
                language={config.language}
              />
            </section>

            {/* Articles */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6 break-after-avoid">Seminal & Important Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-1 print:gap-4">
                {result.articles.map((article, index) => (
                  <div key={index} className="break-inside-avoid">
                    <ArticleCard article={article} />
                  </div>
                ))}
              </div>
            </section>

            {/* Literature Review Section */}
            <section>
               <LiteratureReviewSection 
                 result={result} 
                 language={config.language}
                 existingReview={literatureReview}
                 onReviewGenerated={handleReviewGenerated}
               />
            </section>

            {/* Chat Widget Integration (Web only) */}
            <div className="print:hidden">
                <ChatWidget researchResult={result} />
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;