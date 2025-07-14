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
import { tmdbApi, getImageUrl, getYouTubeUrl, getYouTubeThumbnail } from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface ContentModalProps {
  content: Movie | TVShow;
  type: ContentType;
  genres: Genre[];
  onClose: () => void;
}

const isMovie = (content: any): content is Movie => {
  return 'title' in content;
};

export const ContentModal: React.FC<ContentModalProps> = ({ content, type, genres, onClose }) => {
  const [details, setDetails] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await tmdbApi.getContentDetails(content.id, type);
        setDetails(data);
      } catch (error) {
        console.error('Failed to fetch details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
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
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Backdrop Image */}
          {backdropUrl && (
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Image
                src={backdropUrl}
                alt={title}
                style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'cover' }}
                preview={false}
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
                  {details?.runtime && (
                    <Tag icon={<ClockCircleOutlined />} color="green">
                      {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                    </Tag>
                  )}
                  {details?.number_of_seasons && (
                    <Tag color="purple">{details.number_of_seasons} Seasons</Tag>
                  )}
                </Space>
              </div>
            </div>
          )}

          <div style={{ padding: '0 24px 24px' }}>
            {/* Rating and Stats */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col>
                <Space align="center">
                  <Rate disabled value={rating / 2} />
                  <Text strong style={{ fontSize: 18 }}>{(rating / 2).toFixed(1)}</Text>
                  <Text type="secondary">({content.vote_count} votes)</Text>
                </Space>
              </Col>
            </Row>

            {/* Genres */}
            {contentGenres.length > 0 && (
              <Space style={{ marginBottom: 16 }} wrap>
                {contentGenres.map(genre => (
                  <Tag key={genre.id}>{genre.name}</Tag>
                ))}
              </Space>
            )}

            {/* Overview */}
            <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
              {content.overview || 'No overview available.'}
            </Paragraph>

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
              </TabPane>
            </Tabs>
          </div>
        </>
      )}
    </Modal>
  );
}; 