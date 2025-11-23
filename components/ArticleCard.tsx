import React from 'react';
import { Article } from '../types';
import { ExternalLink, BookOpen } from './Icons';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  
  const formatAuthors = (authors: string) => {
    if (!authors) return '';
    // Split by common separators just in case, mostly commas
    const authorList = authors.split(/,\s*/);
    if (authorList.length <= 3) {
      return authors;
    }
    return `${authorList.slice(0, 3).join(', ')} et al.`;
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <BookOpen size={20} />
        </div>
        {article.url && (
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ExternalLink size={18} />
          </a>
        )}
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{article.title}</h3>
      
      {/* Meta Info Section */}
      <div className="mb-4 flex flex-col gap-1">
        {/* Authors (Truncated) */}
        <div className="text-sm text-slate-600 italic" title={article.authors}>
           {formatAuthors(article.authors)}
        </div>
        
        {/* Journal */}
        {article.journal && (
          <div className="text-sm font-semibold text-slate-800">
            {article.journal}
          </div>
        )}

        {/* Date */}
        {article.publication_date && (
          <div className="text-sm font-medium text-slate-500">
            {article.publication_date}
          </div>
        )}
      </div>
      
      <div className="space-y-3 flex-grow">
        <div className="bg-slate-50 p-3 rounded-md">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">Significance</p>
          <p className="text-sm text-slate-700">{article.significance}</p>
        </div>
        
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1 tracking-wider">AI Summary</p>
          <p className="text-sm text-slate-600 leading-relaxed">{article.ai_summary}</p>
        </div>
      </div>
    </div>
  );
};