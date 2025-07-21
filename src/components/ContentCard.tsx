import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Space, Typography, Rate, Badge, Tooltip } from 'antd';
import { CalendarOutlined, PlayCircleOutlined, StarFilled } from '@ant-design/icons';
import type { Movie, TVShow, ViewType, ContentType } from '../types';
import { getImageUrl } from '../services/api';
import { INDIAN_LANGUAGES } from '../types';
import { useThrottle } from '../hooks/useDebounce';

const { Text, Title, Paragraph } = Typography;

interface ContentCardProps {
  content: Movie | TVShow;
  viewType: ViewType;
  contentType: ContentType;
  isUpcoming?: boolean;
  genres?: { id: number; name: string }[];
}

const isMovie = (content: Movie | TVShow): content is Movie => {
  return 'title' in content;
};

// Get rating color based on value
const getRatingColor = (rating: number) => {
  if (rating >= 7) return '#52c41a'; // green
  if (rating >= 5) return '#faad14'; // yellow
  return '#ff4d4f'; // red
};

export const ContentCard: React.FC<ContentCardProps> = React.memo(({ content, viewType, contentType, isUpcoming, genres = [] }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();
  
  // Handle navigation to detail page
  const handleClick = () => {
    const path = contentType === 'movie' ? `/movie/${content.id}` : `/tv/${content.id}`;
    navigate(path);
  };
  
  // Throttle clicks to prevent rapid navigation
  const throttledClick = useThrottle(handleClick, 500);
  
  const title = isMovie(content) ? content.title : content.name;
  const date = isMovie(content) ? content.release_date : content.first_air_date;
  const year = date ? new Date(date).getFullYear() : 'N/A';
  const posterUrl = getImageUrl(content.poster_path, 'w500');
  const rating = content.vote_average;
  const type = isMovie(content) ? 'Movie' : 'TV Show';
  
  // Get content genres
  const contentGenres = genres.filter(g => content.genre_ids.includes(g.id)).slice(0, 2);
  
  // Get language display name
  const languageName = INDIAN_LANGUAGES[content.original_language as keyof typeof INDIAN_LANGUAGES] || content.original_language.toUpperCase();
  
  // Format release date for upcoming movies
  const formatReleaseDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Release date TBA';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };
  
  const releaseDate = isUpcoming && isMovie(content) ? formatReleaseDate(content.release_date) : null;

  if (viewType === 'list') {
    return (
      <Card
        hoverable
        onClick={throttledClick}
        style={{ 
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0'
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flexShrink: 0, width: 120 }}>
            {posterUrl ? (
              <img 
                src={posterUrl} 
                alt={title}
                style={{ 
                  width: '100%', 
                  height: 180, 
                  objectFit: 'cover',
                  borderRadius: '8px 0 0 8px'
                }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: 180, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f0f0f0',
                borderRadius: '8px 0 0 8px'
              }}>
                <PlayCircleOutlined style={{ fontSize: 48, color: '#ccc' }} />
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, padding: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <Title level={5} style={{ margin: 0 }}>{title}</Title>
                <Space wrap>
                  <Tag color="blue">{type}</Tag>
                  <Tag>{languageName}</Tag>
                  {releaseDate ? (
                    <Tag icon={<CalendarOutlined />} color="orange">{releaseDate}</Tag>
                  ) : (
                    <>
                      <Text type="secondary">{year}</Text>
                      <Space size={4}>
                        <Rate 
                          disabled 
                          defaultValue={rating / 2} 
                          style={{ fontSize: 14, color: getRatingColor(rating) }} 
                        />
                        <Text strong style={{ color: getRatingColor(rating) }}>
                          {(rating / 2).toFixed(1)} ★
                        </Text>
                      </Space>
                    </>
                  )}
                </Space>
              </div>
              
              {contentGenres.length > 0 && (
                <Space>
                  {contentGenres.map(genre => (
                    <Tag key={genre.id} color="default">{genre.name}</Tag>
                  ))}
                </Space>
              )}
              
              <Text type="secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {content.overview || 'No overview available.'}
              </Text>
              
              {!releaseDate && (
                <Space>
                  <Text type="secondary">
                    <StarFilled style={{ color: getRatingColor(rating), marginRight: 4 }} />
                    {content.vote_count.toLocaleString()} votes
                  </Text>
                </Space>
              )}
            </Space>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Badge.Ribbon 
      text={releaseDate} 
      color="orange" 
      style={{ display: releaseDate ? 'block' : 'none' }}
    >
      <Card
        hoverable
        onClick={throttledClick}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          overflow: 'hidden',
          willChange: 'transform'
        }}
        styles={{ body: { padding: 0 } }}
        cover={
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            {posterUrl ? (
              <img 
                alt={title} 
                src={posterUrl}
                style={{ height: 300, width: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ 
                height: 300, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f0f0f0'
              }}>
                <PlayCircleOutlined style={{ fontSize: 64, color: '#ccc' }} />
              </div>
            )}
            
            {/* Hover Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              color: 'white',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: showOverlay ? 1 : 0,
              transition: 'opacity 0.2s ease',
              pointerEvents: showOverlay ? 'auto' : 'none',
              willChange: 'opacity'
            }}>
              <div>
                <Title level={5} style={{ color: 'white', marginBottom: 8 }}>{title}</Title>
                <Paragraph 
                  ellipsis={{ rows: 6 }} 
                  style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: 8 }}
                >
                  {content.overview || 'No overview available.'}
                </Paragraph>
              </div>
              
              <Space direction="vertical" size={4}>
                {contentGenres.length > 0 && (
                  <Space wrap>
                    {contentGenres.map(genre => (
                      <Tag 
                        key={genre.id} 
                        style={{ 
                          fontSize: 11, 
                          margin: 0,
                          background: 'rgba(24, 144, 255, 0.1)',
                          color: '#1890ff',
                          border: '1px solid rgba(24, 144, 255, 0.3)'
                        }}
                      >
                        {genre.name}
                      </Tag>
                    ))}
                  </Space>
                )}
                <Text style={{ color: 'white' }}>
                  <StarFilled style={{ color: getRatingColor(rating), marginRight: 4 }} />
                  {content.vote_count.toLocaleString()} votes
                </Text>
              </Space>
            </div>
          </div>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={6}>
          <Tooltip title={title}>
            <Text strong ellipsis>{title}</Text>
          </Tooltip>
          
          <Space size="small" wrap style={{ width: '100%' }}>
            <Tag color="default" style={{ fontSize: 11, margin: 0 }}>{languageName}</Tag>
            {contentGenres.length > 0 && contentGenres.map(genre => (
              <Tag 
                key={genre.id} 
                style={{ 
                  fontSize: 11, 
                  margin: 0,
                  background: 'rgba(24, 144, 255, 0.1)',
                  color: '#1890ff',
                  border: '1px solid rgba(24, 144, 255, 0.3)'
                }}
              >
                {genre.name}
              </Tag>
            ))}
          </Space>
          
          {!releaseDate && (
            <Space size="small" wrap>
              <Rate 
                disabled 
                defaultValue={rating / 2} 
                style={{ fontSize: 12, color: getRatingColor(rating) }} 
              />
              <Text strong style={{ fontSize: 12, color: getRatingColor(rating) }}>
                {(rating / 2).toFixed(1)} ★
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>• {year}</Text>
            </Space>
          )}
        </Space>
      </Card>
    </Badge.Ribbon>
  );
});

ContentCard.displayName = 'ContentCard'; 