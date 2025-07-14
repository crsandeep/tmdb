import axios from 'axios';
import type { Movie, TVShow, ApiResponse, ContentDetails, Genre, StreamingProvider, ContentType, RuntimeRange, Certification } from '../types';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Validate API key
if (!API_KEY) {
  console.error('TMDB API key is not set. Please add VITE_TMDB_API_KEY to your .env file');
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCached = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key: string, data: any) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// API instance
const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

// API methods
export const tmdbApi = {
  // Get movies by language
  getMovies: async (
    languages: string[],
    page = 1,
    sortBy: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' = 'popularity.desc',
    year?: number,
    yearRange?: [number, number],
    streamingProviders?: number[],
    genres?: number[],
    runtime?: RuntimeRange,
    certification?: string
  ): Promise<ApiResponse<Movie>> => {
    const cacheKey = `movies-${languages.join('-')}-${page}-${sortBy}-${year || 'all'}-${yearRange?.join('-') || 'all'}-${streamingProviders?.join(',') || 'all'}-${genres?.join(',') || 'all'}-${runtime || 'all'}-${certification || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const params: any = {
      page,
      sort_by: sortBy,
      region: 'IN', // For certification
    };

    // When sorting by date, include movies up to today's date
    if (sortBy === 'primary_release_date.desc') {
      const today = new Date();
      params['primary_release_date.lte'] = today.toISOString().split('T')[0];
      
      if (!year && !yearRange) {
        // Include movies from recent years
        params['primary_release_date.gte'] = '2020-01-01';
        // Don't filter by vote count for date sorting - include all movies
        // This ensures very recent releases are shown
      } else {
        // When filtering by specific year, use a lower threshold
        params['vote_count.gte'] = 1;
      }
    } else {
      // For popularity and rating sorts, keep the higher threshold
      params['vote_count.gte'] = 10;
    }

    // Handle language filtering
    if (languages.length === 0 || (languages.length === 1 && languages[0] === 'all')) {
      // Include all Indian languages
      params.with_original_language = 'hi|ta|te|ml|kn';
    } else {
      params.with_original_language = languages.join('|');
    }

    // Handle year/yearRange filtering
    if (year) {
      params.primary_release_year = year;
    } else if (yearRange) {
      params['primary_release_date.gte'] = `${yearRange[0]}-01-01`;
      params['primary_release_date.lte'] = `${yearRange[1]}-12-31`;
    }

    if (streamingProviders && streamingProviders.length > 0) {
      params.with_watch_providers = streamingProviders.join('|');
      params.watch_region = 'IN';
    }

    if (genres && genres.length > 0) {
      params.with_genres = genres.join(',');
    }

    if (runtime && runtime !== 'all') {
      switch (runtime) {
        case 'short':
          params['with_runtime.lte'] = 120; // <= 2 hours
          break;
        case 'medium':
          params['with_runtime.gte'] = 120;
          params['with_runtime.lte'] = 180; // 2-3 hours
          break;
        case 'long':
          params['with_runtime.gte'] = 180; // > 3 hours
          break;
      }
    }

    if (certification) {
      params.certification_country = 'IN';
      params.certification = certification;
    }

    const response = await api.get<ApiResponse<Movie>>('/discover/movie', { params });
    setCache(cacheKey, response.data);
    return response.data;
  },

  // Get TV shows by language
  getTVShows: async (
    languages: string[],
    page = 1,
    sortBy: 'popularity.desc' | 'vote_average.desc' | 'first_air_date.desc' = 'popularity.desc',
    year?: number,
    yearRange?: [number, number],
    streamingProviders?: number[],
    genres?: number[]
  ): Promise<ApiResponse<TVShow>> => {
    const cacheKey = `tv-${languages.join('-')}-${page}-${sortBy}-${year || 'all'}-${yearRange?.join('-') || 'all'}-${streamingProviders?.join(',') || 'all'}-${genres?.join(',') || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const params: any = {
      page,
      sort_by: sortBy,
      'vote_count.gte': 10,
    };

    // Handle language filtering
    if (languages.length === 0 || (languages.length === 1 && languages[0] === 'all')) {
      // Include all Indian languages
      params.with_original_language = 'hi|ta|te|ml|kn';
    } else {
      params.with_original_language = languages.join('|');
    }

    // Handle year/yearRange filtering
    if (year) {
      params.first_air_date_year = year;
    } else if (yearRange) {
      params['first_air_date.gte'] = `${yearRange[0]}-01-01`;
      params['first_air_date.lte'] = `${yearRange[1]}-12-31`;
    }

    if (streamingProviders && streamingProviders.length > 0) {
      params.with_watch_providers = streamingProviders.join('|');
      params.watch_region = 'IN';
    }

    if (genres && genres.length > 0) {
      params.with_genres = genres.join(',');
    }

    const response = await api.get<ApiResponse<TVShow>>('/discover/tv', { params });
    setCache(cacheKey, response.data);
    return response.data;
  },

  // Search content
  searchContent: async (
    query: string,
    type: ContentType,
    languages: string[]
  ): Promise<ApiResponse<Movie | TVShow>> => {
    const cacheKey = `search-${type}-${query}-${languages.join('-')}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const endpoint = type === 'movie' ? '/search/movie' : '/search/tv';
    const response = await api.get<ApiResponse<Movie | TVShow>>(endpoint, {
      params: {
        query,
        language: 'en-US',
      },
    });

    // Filter results by original language
    if (languages.length === 0 || (languages.length === 1 && languages[0] === 'all')) {
      const indianLanguages = ['hi', 'ta', 'te', 'ml', 'kn'];
      response.data.results = response.data.results.filter(
        item => indianLanguages.includes(item.original_language)
      );
    } else {
      response.data.results = response.data.results.filter(
        item => languages.includes(item.original_language)
      );
    }

    setCache(cacheKey, response.data);
    return response.data;
  },

  // Get content details with videos and streaming providers
  getContentDetails: async (
    id: number,
    type: ContentType
  ): Promise<ContentDetails> => {
    const cacheKey = `details-${type}-${id}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
    const response = await api.get<ContentDetails>(endpoint, {
      params: {
        append_to_response: 'videos,watch/providers',
      },
    });

    setCache(cacheKey, response.data);
    return response.data;
  },

  // Get genres
  getGenres: async (type: ContentType): Promise<Genre[]> => {
    const cacheKey = `genres-${type}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const endpoint = `/genre/${type}/list`;
    const response = await api.get<{ genres: Genre[] }>(endpoint);
    
    setCache(cacheKey, response.data.genres);
    return response.data.genres;
  },

  // Get streaming providers for India
  getStreamingProviders: async (): Promise<StreamingProvider[]> => {
    const cacheKey = 'providers-IN';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const response = await api.get<{ results: StreamingProvider[] }>('/watch/providers/movie', {
      params: {
        watch_region: 'IN',
      },
    });

    setCache(cacheKey, response.data.results);
    return response.data.results;
  },

  // Get upcoming movies
  getUpcomingMovies: async (
    languages: string[],
    page = 1
  ): Promise<ApiResponse<Movie>> => {
    const cacheKey = `upcoming-${languages.join('-')}-${page}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6); // Next 6 months

    const params: any = {
      page,
      sort_by: 'primary_release_date.asc',
      'primary_release_date.gte': today.toISOString().split('T')[0],
      'primary_release_date.lte': futureDate.toISOString().split('T')[0],
      region: 'IN',
    };

    // Handle language filtering
    if (languages.length === 0 || (languages.length === 1 && languages[0] === 'all')) {
      params.with_original_language = 'hi|ta|te|ml|kn';
    } else {
      params.with_original_language = languages.join('|');
    }

    const response = await api.get<ApiResponse<Movie>>('/discover/movie', { params });
    setCache(cacheKey, response.data);
    return response.data;
  },

  // Get movie certifications for India
  getCertifications: async (): Promise<Certification[]> => {
    const cacheKey = 'certifications-IN';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const response = await api.get<{ certifications: { IN: Certification[] } }>('/certification/movie/list');
    const indianCerts = response.data.certifications.IN || [];
    
    setCache(cacheKey, indianCerts);
    return indianCerts;
  },
};

// Image URL helpers
export const getImageUrl = (path: string | null, size: 'w200' | 'w500' | 'original' = 'w500') => {
  if (!path) return undefined;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export const getYouTubeUrl = (key: string) => {
  return `https://www.youtube.com/watch?v=${key}`;
};

export const getYouTubeThumbnail = (key: string) => {
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
}; 