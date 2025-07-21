import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tag, 
  Space, 
  Typography, 
  Rate, 
  Spin, 
  Image,
  Row,
  Col,
  List,
  Avatar,
  Tabs
} from 'antd';
import { 
  PlayCircleOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined
} from '@ant-design/icons';
import type { Movie, TVShow, ContentType, ContentDetails, Genre } from '../types';
import { tmdbApi, getImageUrl, getYouTubeUrl, getYouTubeThumbnail, getIMDbUrl } from '../services/api';
import { contentDetailsCache } from '../utils/cache';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface ContentModalProps {
  content: Movie | TVShow;
  type: ContentType;
  genres: Genre[];
  onClose: () => void;
  onPersonSelect?: (person: { id: number; name: string }) => void;
}

const isMovie = (content: any): content is Movie => {
  return 'title' in content;
};

export const ContentModal: React.FC<ContentModalProps> = ({ content, type, genres, onClose, onPersonSelect }) => {
  const [details, setDetails] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cacheKey = `${type}-${content.id}`;
        const cachedData = contentDetailsCache.get(cacheKey);
        
        if (cachedData) {
          setDetails(cachedData);
          setLoading(false);
          return;
        }
        
        // Fetch from API if not in cache
        const data = await tmdbApi.getContentDetails(content.id, type);
        
        // Cache the result
        contentDetailsCache.set(cacheKey, data);
        setDetails(data);
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent rapid successive API calls
    const timeoutId = setTimeout(fetchDetails, 100);
    return () => clearTimeout(timeoutId);
  }, [content.id, type]);

  const title = isMovie(content) ? content.title : content.name;
  const releaseDate = isMovie(content) ? content.release_date : content.first_air_date;
  const backdropUrl = getImageUrl(content.backdrop_path || content.poster_path, 'original');
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const rating = content.vote_average;
  
  const contentGenres = content.genre_ids
    .map(id => genres.find(g => g.id === id))
    .filter(Boolean) as Genre[];

  const trailers = details?.videos?.results?.filter(v => v.type === 'Trailer') || [];
  const watchProviders = details?.['watch/providers']?.results?.IN;

  return (
    <Modal
      open={true}
      onCancel={onClose}
      width={800}
      footer={null}
      styles={{ body: { padding: 0 } }}
      destroyOnClose={true}
    >
      {/* Always show backdrop/basic info immediately */}
      {backdropUrl && (
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Image
            src={backdropUrl}
            alt={title}
            style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'cover' }}
            preview={false}
            placeholder={
              <div style={{ 
                height: 400, 
                background: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Spin size="large" />
              </div>
            }
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            padding: '40px 24px 20px',
          }}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>{title}</Title>
            <Space style={{ marginTop: 8 }}>
              <Tag icon={<CalendarOutlined />} color="blue">{year}</Tag>
              {!loading && details?.runtime && (
                <Tag icon={<ClockCircleOutlined />} color="green">
                  {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                </Tag>
              )}
              {!loading && details?.number_of_seasons && (
                <Tag color="purple">{details.number_of_seasons} Seasons</Tag>
              )}
            </Space>
          </div>
        </div>
      )}

      <div style={{ padding: '0 24px 24px' }}>
        {/* Rating and Stats - Show immediately with basic data */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col>
            <Space align="center">
              <Rate disabled value={rating / 2} />
              <Text strong style={{ fontSize: 18 }}>{(rating / 2).toFixed(1)}</Text>
              <Text type="secondary">({content.vote_count} votes)</Text>
            </Space>
          </Col>
        </Row>

        {/* Genres - Show immediately */}
        {contentGenres.length > 0 && (
          <Space style={{ marginBottom: 16 }} wrap>
            {contentGenres.map(genre => (
              <Tag key={genre.id}>{genre.name}</Tag>
            ))}
          </Space>
        )}

        {/* Overview - Show immediately */}
        <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
          {content.overview || 'No overview available.'}
        </Paragraph>

        {/* Show loading state only for additional details */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: 16 }}>Loading additional details...</Text>
          </div>
        ) : (
          <Tabs defaultActiveKey="1">
            {/* Trailers */}
            {trailers.length > 0 && (
              <TabPane tab="Trailers" key="1">
                  <Row gutter={[16, 16]}>
                    {trailers.slice(0, 4).map(video => (
                      <Col key={video.key} xs={24} md={12}>
                        <a href={getYouTubeUrl(video.key)} target="_blank" rel="noopener noreferrer">
                          <div style={{ position: 'relative' }}>
                            <Image
                              src={getYouTubeThumbnail(video.key)}
                              alt={video.name}
                              style={{ width: '100%', borderRadius: 8 }}
                              preview={false}
                            />
                            <PlayCircleOutlined style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              fontSize: 48,
                              color: 'white',
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                            }} />
                          </div>
                          <Text style={{ marginTop: 8, display: 'block' }}>{video.name}</Text>
                        </a>
                      </Col>
                    ))}
                  </Row>
                </TabPane>
              )}

              {/* Watch Providers */}
              {watchProviders && (
                <TabPane tab="Where to Watch" key="2">
                  <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {watchProviders.flatrate && (
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Stream</Text>
                        <Space>
                          {watchProviders.flatrate.map(provider => (
                            <Avatar
                              key={provider.provider_id}
                              src={getImageUrl(provider.logo_path, 'w200')}
                              size={48}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Space>
                      </div>
                    )}
                    
                    {watchProviders.rent && (
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Rent</Text>
                        <Space>
                          {watchProviders.rent.map(provider => (
                            <Avatar
                              key={provider.provider_id}
                              src={getImageUrl(provider.logo_path, 'w200')}
                              size={48}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Space>
                      </div>
                    )}
                    
                    {watchProviders.buy && (
                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Buy</Text>
                        <Space>
                          {watchProviders.buy.map(provider => (
                            <Avatar
                              key={provider.provider_id}
                              src={getImageUrl(provider.logo_path, 'w200')}
                              size={48}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Space>
                      </div>
                    )}
                  </Space>
                </TabPane>
              )}

              {/* Cast and Crew */}
              {details?.credits && (
                <TabPane tab="Cast & Crew" key="4">
                  <Tabs type="card" size="small">
                    {details.credits.cast && details.credits.cast.length > 0 && (
                      <TabPane tab="Cast" key="cast">
                        <Row gutter={[16, 16]}>
                          {details.credits.cast.slice(0, 12).map(actor => (
                            <Col key={actor.id} xs={12} sm={8} md={6}>
                              <div 
                                style={{ 
                                  textAlign: 'center', 
                                  cursor: 'pointer',
                                  padding: 8,
                                  borderRadius: 8,
                                  transition: 'background-color 0.2s'
                                }}
                                onClick={() => onPersonSelect?.({ id: actor.id, name: actor.name })}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Avatar
                                  size={64}
                                  src={actor.profile_path ? getImageUrl(actor.profile_path, 'w200') : undefined}
                                  style={{ marginBottom: 8 }}
                                >
                                  {actor.name.charAt(0)}
                                </Avatar>
                                <div>
                                  <Text strong style={{ fontSize: 12, display: 'block' }}>
                                    {actor.name}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {actor.character}
                                  </Text>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </TabPane>
                    )}
                    
                    {details.credits.crew && details.credits.crew.length > 0 && (
                      <TabPane tab="Crew" key="crew">
                        <Row gutter={[16, 16]}>
                          {details.credits.crew
                            .filter(member => ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay'].includes(member.job))
                            .slice(0, 12)
                            .map((member, index) => (
                            <Col key={`${member.id}-${index}`} xs={12} sm={8} md={6}>
                              <div 
                                style={{ 
                                  textAlign: 'center', 
                                  cursor: 'pointer',
                                  padding: 8,
                                  borderRadius: 8,
                                  transition: 'background-color 0.2s'
                                }}
                                onClick={() => onPersonSelect?.({ id: member.id, name: member.name })}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Avatar
                                  size={64}
                                  src={member.profile_path ? getImageUrl(member.profile_path, 'w200') : undefined}
                                  style={{ marginBottom: 8 }}
                                >
                                  {member.name.charAt(0)}
                                </Avatar>
                                <div>
                                  <Text strong style={{ fontSize: 12, display: 'block' }}>
                                    {member.name}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {member.job}
                                  </Text>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </TabPane>
                    )}
                  </Tabs>
                </TabPane>
              )}

              {/* Details */}
              <TabPane tab="Details" key="3">
                <List>
                  <List.Item>
                    <Text strong>Original Language:</Text>
                    <Text>{content.original_language.toUpperCase()}</Text>
                  </List.Item>
                  <List.Item>
                    <Text strong>Original Title:</Text>
                    <Text>{isMovie(content) ? content.original_title : content.original_name}</Text>
                  </List.Item>
                  {details?.tagline && (
                    <List.Item>
                      <Text strong>Tagline:</Text>
                      <Text italic>"{details.tagline}"</Text>
                    </List.Item>
                  )}
                  {details?.status && (
                    <List.Item>
                      <Text strong>Status:</Text>
                      <Text>{details.status}</Text>
                    </List.Item>
                  )}
                  {details?.budget && details.budget > 0 && (
                    <List.Item>
                      <Text strong>Budget:</Text>
                      <Text>${details.budget.toLocaleString()}</Text>
                    </List.Item>
                  )}
                  {details?.revenue && details.revenue > 0 && (
                    <List.Item>
                      <Text strong>Revenue:</Text>
                      <Text>${details.revenue.toLocaleString()}</Text>
                    </List.Item>
                  )}
                </List>

                {/* External Links */}
                {details?.external_ids && (
                  <div style={{ marginTop: 24 }}>
                    <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 16 }}>
                      External Links
                    </Text>
                    <Space wrap>
                      {details.external_ids.imdb_id && (
                        <a
                          href={getIMDbUrl(details.external_ids.imdb_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            backgroundColor: '#f6c700',
                            color: '#000',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e6b800';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f6c700';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          📽️ View on IMDb
                        </a>
                      )}
                      {details.external_ids.facebook_id && (
                        <a
                          href={`https://www.facebook.com/${details.external_ids.facebook_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            backgroundColor: '#1877F2',
                            color: '#fff',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#166fe5';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1877F2';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          👥 Facebook
                        </a>
                      )}
                      {details.external_ids.twitter_id && (
                        <a
                          href={`https://twitter.com/${details.external_ids.twitter_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            backgroundColor: '#1DA1F2',
                            color: '#fff',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1991db';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#1DA1F2';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          🐦 Twitter
                        </a>
                      )}
                      {details.external_ids.instagram_id && (
                        <a
                          href={`https://www.instagram.com/${details.external_ids.instagram_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '8px 16px',
                            background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                            color: '#fff',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.filter = 'brightness(0.9)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        >
                          📷 Instagram
                        </a>
                      )}
                    </Space>
                  </div>
                )}
              </TabPane>
            </Tabs>
          )}
      </div>
    </Modal>
  );
}; 