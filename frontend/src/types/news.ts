export type NewsArticle = {
  id: number;
  title: string;
  source: string;
  summary?: string | null;
  publishedAt?: string | null;
  url: string;
  category?: string | null;
  collectedAt: string;
};

export type NewsCollectionResponse = {
  targetDate: string;
  collectedCount: number;
  insertedCount: number;
  skippedCount: number;
  articles: NewsArticle[];
};
