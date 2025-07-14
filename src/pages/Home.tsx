import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Layout, 
  Row, 
  Col, 
  Select, 
  Typography, 
  Slider, 
  Space, 
  Spin, 
  Empty,
  Tag,
  Tabs,
  Segmented,
  Input,
  Button,
  Drawer,
  Badge
} from 'antd';
import { 
  SearchOutlined, 
  PlayCircleOutlined, 
  AppstoreOutlined, 
  BarsOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { ContentCard } from '../components/ContentCard';
import { ContentModal } from '../components/ContentModal';
import { useContent } from '../hooks/useContent';
import type { Movie, TVShow, ContentType, ViewType, SortBy, Genre } from '../types';
import { tmdbApi } from '../services/api';
import { INDIAN_LANGUAGES, STREAMING_PROVIDERS } from '../types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const sortOptions = [
  { label: 'Popularity', value: 'popularity' as SortBy },
  { label: 'Rating', value: 'rating' as SortBy },
  { label: 'Year', value: 'year' as SortBy }
];

const runtimeOptions = [
  { label: 'All Durations', value: null },
  { label: 'Short (< 90 min)', value: 'short' },
  { label: 'Medium (90-150 min)', value: 'medium' },
  { label: 'Long (> 150 min)', value: 'long' }
];

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'upcoming'>('browse');
  const [contentType, setContentType] = useState<ContentType>('movie');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('popularity');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['all']);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [runtime, setRuntime] = useState<string | null>(null);
  const [yearRange, setYearRange] = useState<[number, number]>([1920, new Date().getFullYear()]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedContent, setSelectedContent] = useState<(Movie | TVShow) | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const loadingRef = useRef(false);

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate active filter count
  const activeFilterCount = [
    selectedLanguages.length > 0 && !selectedLanguages.includes('all'),
    selectedProviders.length > 0,
    selectedGenres.length > 0,
    yearRange[0] !== 1920 || yearRange[1] !== new Date().getFullYear(),
    runtime !== null
  ].filter(Boolean).length;

  const { content, loading, error, page, totalPages, loadMore } = useContent({
    type: contentType,
    sortBy,
    languages: selectedLanguages,
    streamingProviders: selectedProviders,
    genres: selectedGenres,
    yearRange,
    runtime: runtime as any,
    upcoming: activeTab === 'upcoming'
  });

  useEffect(() => {
    tmdbApi.getGenres(contentType).then(setGenres);
  }, [contentType]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loadingRef.current || loading || page >= totalPages) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // Load more when user is within 300px of the bottom
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      loadingRef.current = true;
      loadMore();
    }
  }, [loading, page, totalPages, loadMore]);

  // Set up infinite scroll
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const filteredContent = content
    .filter(item => activeTab === 'upcoming' || item.vote_count > 0)
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const title = contentType === 'movie' 
        ? (item as Movie).title 
        : (item as TVShow).name;
      return title.toLowerCase().includes(query) || 
             item.overview.toLowerCase().includes(query);
    });

  const allLanguageOptions = [
    { label: 'All Languages', value: 'all' },
    ...Object.entries(INDIAN_LANGUAGES)
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([code, name]) => ({
        label: name,
        value: code
      }))
  ];

  const streamingOptions = Object.entries(STREAMING_PROVIDERS).map(([id, name]) => ({
    label: name,
    value: parseInt(id)
  }));

  const quickGenres = genres.slice(0, 5);

  const handleGenreQuickFilter = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleLanguageChange = (values: string[]) => {
    if (values.includes('all') && !selectedLanguages.includes('all')) {
      setSelectedLanguages(['all']);
    } else if (!values.includes('all') && selectedLanguages.includes('all')) {
      setSelectedLanguages(values.length > 0 ? values : ['all']);
    } else if (values.includes('all') && values.length > 1) {
      setSelectedLanguages(values.filter(v => v !== 'all'));
    } else {
      setSelectedLanguages(values.length > 0 ? values : ['all']);
    }
  };

  const FilterContent = () => (
    <>
      {/* Language Filter */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Language</Text>
        <Select
          mode="multiple"
          placeholder="Select languages"
          style={{ width: '100%' }}
          value={selectedLanguages}
          onChange={handleLanguageChange}
          options={allLanguageOptions}
          maxTagCount={isMobile ? 1 : 3}
        />
      </div>

      {/* Sort By */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Sort By</Text>
        <Select
          style={{ width: '100%' }}
          value={sortBy}
          onChange={setSortBy}
          options={sortOptions}
        />
      </div>

      {/* Streaming Platform */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Streaming Platform</Text>
        <Select
          mode="multiple"
          placeholder="All Platforms"
          style={{ width: '100%' }}
          value={selectedProviders}
          onChange={setSelectedProviders}
          options={streamingOptions}
          maxTagCount={isMobile ? 1 : 3}
        />
      </div>

      {/* Genre Filter */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>Genres</Text>
        <Select
          mode="multiple"
          placeholder="All Genres"
          style={{ width: '100%' }}
          value={selectedGenres}
          onChange={setSelectedGenres}
          maxTagCount={isMobile ? 1 : 3}
          options={genres.map(g => ({ label: g.name, value: g.id }))}
        />
      </div>

      {/* Year Range */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Year Range: {yearRange[0]} - {yearRange[1]}
        </Text>
        <Slider
          range
          min={1920}
          max={new Date().getFullYear()}
          value={yearRange}
          onChange={(value) => setYearRange(value as [number, number])}
        />
      </div>

      {/* Runtime Filter (Movies only) */}
      {contentType === 'movie' && (
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Runtime</Text>
          <Select
            style={{ width: '100%' }}
            value={runtime}
            onChange={setRuntime}
            options={runtimeOptions}
            placeholder="All Durations"
          />
        </div>
      )}
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Compact Header for Mobile */}
      <Header style={{ 
        background: '#001529', 
        padding: isMobile ? '0 16px' : '0 50px',
        height: isMobile ? 56 : 64,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={isMobile ? 4 : 3} style={{ color: 'white', margin: 0 }}>
          {isMobile ? '🎬 Indian Cinema' : '🎬 Indian Cinema Hub'}
        </Title>
      </Header>

      <Content style={{ padding: isMobile ? 16 : '24px 50px' }}>
        <div style={{ background: '#fff', padding: isMobile ? 16 : 24, borderRadius: 8 }}>
          
          {/* Browse/Upcoming Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'browse' | 'upcoming')}
            style={{ marginBottom: 20 }}
            items={[
              { key: 'browse', label: 'Browse All' },
              { key: 'upcoming', label: 'Upcoming Releases', disabled: contentType === 'tv' }
            ]}
          />

          {/* Mobile: Stack controls vertically */}
          {isMobile ? (
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Segmented
                value={contentType}
                onChange={setContentType as any}
                style={{ width: '100%' }}
                block
                options={[
                  { 
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <PlayCircleOutlined style={{ marginRight: 4 }} /> Movies
                      </span>
                    ), 
                    value: 'movie' 
                  },
                  { 
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                        <AppstoreOutlined style={{ marginRight: 4 }} /> TV
                      </span>
                    ), 
                    value: 'tv' 
                  }
                ]}
              />
              <Search
                placeholder={`Search ${contentType === 'movie' ? 'movies' : 'TV shows'}...`}
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
              />
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterDrawerOpen(true)}
                style={{ width: '100%' }}
              >
                Filters {activeFilterCount > 0 && <Badge count={activeFilterCount} style={{ marginLeft: 8 }} />}
              </Button>
            </Space>
          ) : (
            /* Desktop: Original layout */
            <>
              <div style={{ marginBottom: 20 }}>
                <Row gutter={16} align="middle">
                  <Col>
                    <Segmented
                      value={contentType}
                      onChange={setContentType as any}
                      size="large"
                      style={{ fontSize: 16, fontWeight: 500 }}
                      options={[
                        { 
                          label: (
                            <span style={{ padding: '4px 16px' }}>
                              <PlayCircleOutlined style={{ marginRight: 8 }} />
                              Movies
                            </span>
                          ), 
                          value: 'movie' 
                        },
                        { 
                          label: (
                            <span style={{ padding: '4px 16px' }}>
                              <AppstoreOutlined style={{ marginRight: 8 }} />
                              TV Shows
                            </span>
                          ), 
                          value: 'tv' 
                        }
                      ]}
                    />
                  </Col>
                  <Col flex="auto">
                    <Search
                      placeholder={`Search ${contentType === 'movie' ? 'movies' : 'TV shows'}...`}
                      allowClear
                      size="large"
                      prefix={<SearchOutlined />}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col>
                    <Segmented
                      value={viewType}
                      onChange={setViewType as any}
                      options={[
                        { label: <AppstoreOutlined />, value: 'grid' },
                        { label: <BarsOutlined />, value: 'list' }
                      ]}
                    />
                  </Col>
                </Row>
              </div>

              {/* Desktop Filters */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Language</Text>
                  <Select
                    mode="multiple"
                    placeholder="Select languages"
                    style={{ width: '100%' }}
                    value={selectedLanguages}
                    onChange={handleLanguageChange}
                    options={allLanguageOptions}
                    maxTagCount={2}
                  />
                </Col>

                <Col xs={24} sm={12} md={4}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Sort By</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={sortBy}
                    onChange={setSortBy}
                    options={sortOptions}
                  />
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Streaming Platform</Text>
                  <Select
                    mode="multiple"
                    placeholder="All Platforms"
                    style={{ width: '100%' }}
                    value={selectedProviders}
                    onChange={setSelectedProviders}
                    options={streamingOptions}
                    maxTagCount={2}
                  />
                </Col>

                <Col xs={24} sm={12} md={8}>
                  <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>Advanced</Text>
                  <Button 
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    style={{ width: '100%' }}
                    icon={<FilterOutlined />}
                  >
                    More Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </Button>
                </Col>
              </Row>

              {/* Advanced Filters - Desktop */}
              {showAdvancedFilters && (
                <div style={{ 
                  marginBottom: 24, 
                  padding: 16, 
                  background: '#fafafa', 
                  borderRadius: 8,
                  border: '1px solid #f0f0f0' 
                }}>
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>Genres</Text>
                      <Select
                        mode="multiple"
                        placeholder="All Genres"
                        style={{ width: '100%' }}
                        value={selectedGenres}
                        onChange={setSelectedGenres}
                        maxTagCount={3}
                        options={genres.map(g => ({ label: g.name, value: g.id }))}
                      />
                    </Col>
                    
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Year Range: {yearRange[0]} - {yearRange[1]}
                      </Text>
                      <Slider
                        range
                        min={1920}
                        max={new Date().getFullYear()}
                        value={yearRange}
                        onChange={(value) => setYearRange(value as [number, number])}
                      />
                    </Col>
                    
                    {contentType === 'movie' && (
                      <Col xs={24} md={8}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Runtime</Text>
                        <Select
                          style={{ width: '100%' }}
                          value={runtime}
                          onChange={setRuntime}
                          options={runtimeOptions}
                          placeholder="All Durations"
                        />
                      </Col>
                    )}
                  </Row>
                </div>
              )}
            </>
          )}

          {/* Mobile Filter Drawer */}
          <Drawer
            title="Filters"
            placement="bottom"
            onClose={() => setFilterDrawerOpen(false)}
            open={filterDrawerOpen}
            height="80%"
            extra={
              <Button 
                type="text" 
                size="small"
                onClick={() => {
                  setSelectedLanguages(['all']);
                  setSelectedProviders([]);
                  setSelectedGenres([]);
                  setYearRange([1920, new Date().getFullYear()]);
                  setRuntime(null);
                }}
              >
                Clear All
              </Button>
            }
          >
            <FilterContent />
          </Drawer>

          {/* Active Filter Tags */}
          {!isMobile && (selectedLanguages.length > 0 && !selectedLanguages.includes('all')) || 
           selectedProviders.length > 0 || selectedGenres.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Text type="secondary">Active filters:</Text>
                {selectedLanguages.length > 0 && !selectedLanguages.includes('all') && 
                  selectedLanguages.map(lang => {
                    const langName = allLanguageOptions.find(opt => opt.value === lang)?.label;
                    return (
                      <Tag 
                        key={lang} 
                        closable 
                        onClose={() => setSelectedLanguages(prev => prev.filter(l => l !== lang))}
                      >
                        {langName}
                      </Tag>
                    );
                  })
                }
                {selectedProviders.map(providerId => {
                  const provider = streamingOptions.find(p => p.value === providerId);
                  return (
                    <Tag 
                      key={providerId} 
                      closable 
                      onClose={() => setSelectedProviders(prev => prev.filter(p => p !== providerId))}
                    >
                      {provider?.label}
                    </Tag>
                  );
                })}
                {selectedGenres.map(genreId => {
                  const genre = genres.find(g => g.id === genreId);
                  return (
                    <Tag 
                      key={genreId} 
                      closable 
                      onClose={() => setSelectedGenres(prev => prev.filter(g => g !== genreId))}
                    >
                      {genre?.name}
                    </Tag>
                  );
                })}
              </Space>
            </div>
          ) : null}

          {/* Quick Genre Filters - Only on Desktop */}
          {!isMobile && quickGenres.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Space size={8} wrap>
                <Text strong>Filter by Genre:</Text>
                <Tag 
                  color={selectedGenres.length === 0 ? 'blue' : 'default'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedGenres([])}
                >
                  All Genres
                </Tag>
                {quickGenres.map(genre => (
                  <Tag
                    key={genre.id}
                    color={selectedGenres.includes(genre.id) ? 'blue' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleGenreQuickFilter(genre.id)}
                  >
                    {genre.name}
                  </Tag>
                ))}
                {genres.length > 5 && (
                  <Tag
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowAdvancedFilters(true)}
                  >
                    More...
                  </Tag>
                )}
              </Space>
            </div>
          )}

          {/* Results Count */}
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Showing {filteredContent.length}+ {contentType === 'movie' ? 'movies' : 'TV shows'}
            </Text>
          </div>

          {/* Content Grid */}
          {loading && page === 1 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : error ? (
            <Empty description="Failed to load content. Please try again." />
          ) : filteredContent.length === 0 && !loading ? (
            <Empty description="No content found with the selected filters." />
          ) : (
            <div style={{ minHeight: '400px' }}>
              <Row gutter={[16, 16]}>
                {filteredContent.map(item => (
                  <Col 
                    key={item.id} 
                    xs={12} 
                    sm={8} 
                    md={6} 
                    lg={viewType === 'list' ? 24 : 4}
                    xl={viewType === 'list' ? 24 : 4}
                  >
                    <ContentCard
                      content={item}
                      viewType={isMobile ? 'grid' : viewType}
                      onClick={() => setSelectedContent(item)}
                      isUpcoming={activeTab === 'upcoming'}
                      genres={genres}
                    />
                  </Col>
                ))}
              </Row>
              
              {/* Loading indicator for infinite scroll */}
              {loading && page > 1 && (
                <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 32 }}>
                  <Spin size="large" />
                </div>
              )}
            </div>
          )}
        </div>
      </Content>

      {/* Content Modal */}
      {selectedContent && (
        <ContentModal
          content={selectedContent}
          type={contentType}
          genres={genres}
          onClose={() => setSelectedContent(null)}
        />
      )}
    </Layout>
  );
}; 