export type Language = 'en' | 'zh' | 'ja';

export interface Article {
  title: string;
  authors: string;
  publication_date: string;
  ai_summary: string;
  significance: string;
  url: string;
}

export interface ResearchResult {
  topic: string;
  summary: string;
  articles: Article[];
  suggestedVisualPrompt: string;
}

export type ImageSize = '1K' | '2K' | '4K';

export interface ImageGenerationState {
  isLoading: boolean;
  imageUrl: string | null;
  error: string | null;
}

export type ResearchFocus = 'classic' | 'balanced' | 'recent';
export type ArticleCount = 10 | 20 | 30;

export interface ResearchConfig {
  focus: ResearchFocus;
  count: ArticleCount;
  language: Language;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  topic: string;
  result: ResearchResult;
  timelineImage: string | null;
  config: ResearchConfig;
}