export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface StreamingProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface ApiResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface ContentDetails {
  id: number;
  runtime?: number;
  number_of_seasons?: number;
  tagline?: string;
  status?: string;
  budget?: number;
  revenue?: number;
  videos?: {
    results: Video[];
  };
  "watch/providers"?: {
    results: {
      IN?: {
        flatrate?: StreamingProvider[];
        rent?: StreamingProvider[];
        buy?: StreamingProvider[];
      };
    };
  };
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export type ContentType = 'movie' | 'tv';
export type ViewType = 'grid' | 'list';
export type SortBy = 'popularity' | 'rating' | 'year';

export interface Filters {
  languages: string[];
  sortBy: SortBy;
  year?: number;
  streamingProviders?: number[];
  genres?: number[];
  runtime?: RuntimeRange;
  certification?: string;
}

export type RuntimeRange = 'all' | 'short' | 'medium' | 'long';

export interface Certification {
  certification: string;
  meaning: string;
  order: number;
}

export const INDIAN_LANGUAGES = {
  hi: 'Hindi',
  kn: 'Kannada',
  ml: 'Malayalam',
  ta: 'Tamil',
  te: 'Telugu'
} as const;

export const STREAMING_PROVIDERS = {
  8: 'Netflix',
  119: 'Amazon Prime Video',
  122: 'Disney Plus Hotstar',
  232: 'Zee5',
  237: 'SonyLIV',
  121: 'Voot',
  515: 'MX Player',
  220: 'Jio Cinema',
  350: 'Apple TV Plus',
  583: 'Lionsgate Play'
} as const;

export type IndianLanguageCode = keyof typeof INDIAN_LANGUAGES | 'all'; 