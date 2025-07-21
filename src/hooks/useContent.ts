import { useState, useEffect, useCallback } from 'react';
import { tmdbApi } from '../services/api';
import type { Movie, TVShow, ContentType, SortBy, ApiResponse, RuntimeRange } from '../types';

interface UseContentParams {
  type: ContentType;
  languages: string[];
  sortBy: SortBy;
  year?: number;
  yearRange?: [number, number];
  streamingProviders?: number[];
  genres?: number[];
  runtime?: RuntimeRange;
  certification?: string;
  upcoming?: boolean;
  personId?: number;
}

interface UseContentReturn {
  content: (Movie | TVShow)[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  loadMore: () => void;
  refresh: () => void;
}

export const useContent = ({
  type,
  languages,
  sortBy,
  year,
  yearRange,
  streamingProviders,
  genres,
  runtime,
  certification,
  upcoming,
  personId,
}: UseContentParams): UseContentReturn => {
  const [content, setContent] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const sortByMap = {
    popularity: 'popularity.desc',
    rating: 'vote_average.desc',
    year: type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc',
  } as const;

  const fetchContent = useCallback(async (pageNum: number, append = false) => {
    try {
      setLoading(true);
      setError(null);

      let response: ApiResponse<Movie | TVShow>;
      
      // If filtering by person, use person-specific API calls
      if (personId) {
        if (type === 'movie') {
          response = await tmdbApi.getMoviesByPerson(
            personId,
            pageNum,
            sortByMap[sortBy] as any,
            streamingProviders,
            genres,
            year,
            yearRange
          );
        } else {
          response = await tmdbApi.getTVShowsByPerson(
            personId,
            pageNum,
            sortByMap[sortBy] as any,
            streamingProviders,
            genres,
            year,
            yearRange
          );
        }
      } else if (upcoming && type === 'movie') {
        response = await tmdbApi.getUpcomingMovies(languages, pageNum);
      } else if (type === 'movie') {
        response = await tmdbApi.getMovies(
          languages,
          pageNum,
          sortByMap[sortBy] as any,
          year,
          yearRange,
          streamingProviders,
          genres,
          runtime,
          certification
        );
      } else {
        response = await tmdbApi.getTVShows(
          languages,
          pageNum,
          sortByMap[sortBy] as any,
          year,
          yearRange,
          streamingProviders,
          genres
        );
      }

      setContent(prev => append ? [...prev, ...response.results] : response.results);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [type, languages, sortBy, year, yearRange, streamingProviders, genres, runtime, certification, upcoming, personId]);

  useEffect(() => {
    setPage(1);
    setContent([]);
    fetchContent(1);
  }, [fetchContent]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContent(nextPage, true);
    }
  }, [page, totalPages, loading, fetchContent]);

  const refresh = useCallback(() => {
    setPage(1);
    setContent([]);
    fetchContent(1);
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    page,
    totalPages,
    loadMore,
    refresh,
  };
}; 