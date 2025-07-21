import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout,
  Button,
  Tag, 
  Space, 
  Typography, 
  Rate, 
  Spin, 
  Result,
  Row,
  Col,
  Card,
  Image,
  Divider,
  Avatar,
  Tabs
} from 'antd';
import { 
  ArrowLeftOutlined,
  CalendarOutlined, 
  ClockCircleOutlined,
  StarFilled,
  PlayCircleOutlined
} from '@ant-design/icons';
import { App } from '@capacitor/app';
import type { Movie, TVShow, ContentType, ContentDetails, Genre } from '../types';
import { tmdbApi, getImageUrl, getYouTubeUrl, getYouTubeThumbnail, getIMDbUrl } from '../services/api';

const { Content } = Layout;
const { Title, Text } = Typography;

interface ContentDetailProps {
  type: ContentType;
}

const isMovie = (content: any): content is Movie => {
  return 'title' in content;
};

export const ContentDetail: React.FC<ContentDetailProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<Movie | TVShow | null>(null);
  const [details, setDetails] = useState<ContentDetails | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle Android back button
  useEffect(() => {
    let backButtonListener: any = null;

    const setupBackButtonHandler = async () => {
      try {
        // Register hardware back button handler with priority
        backButtonListener = await App.addListener('backButton', () => {
          console.log('Hardware back button pressed');
          
          // Always navigate to home instead of default behavior
          navigate('/', { replace: true });
          
          // Return false to prevent default behavior (app closing)
          return false;
        });
        
        console.log('Capacitor back button listener registered');
      } catch (error) {
        console.log('Capacitor App plugin not available, using web fallback');
        
        // Web fallback - prevent browser back
        const handlePopState = () => {
          console.log('PopState event triggered');
          // Push state back to prevent going back
          window.history.pushState({ page: 'detail' }, '', window.location.href);
          // Navigate to home
          navigate('/', { replace: true });
        };

        // Add initial state
        window.history.pushState({ page: 'detail' }, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        // Store cleanup for web
        backButtonListener = () => {
          window.removeEventListener('popstate', handlePopState);
        };
      }
    };

    setupBackButtonHandler();

    // Cleanup
    return () => {
      if (backButtonListener) {
        if (typeof backButtonListener === 'function') {
          backButtonListener();
        } else {
          backButtonListener.remove();
        }
      }
    };
  }, [navigate]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch genres
        const genreData = await tmdbApi.getGenres(type);
        setGenres(genreData);
        
        // Fetch detailed content info
        const detailData = await tmdbApi.getContentDetails(parseInt(id), type);
        setDetails(detailData);
        
        // Extract basic content info from details
        const basicContent = {
          id: parseInt(id),
          overview: detailData.overview || '',
          poster_path: detailData.poster_path || null,
          backdrop_path: detailData.backdrop_path || null,
          vote_average: detailData.vote_average || 0,
          vote_count: detailData.vote_count || 0,
          popularity: detailData.popularity || 0,
          genre_ids: detailData.genres?.map((g: any) => g.id) || [],
          original_language: detailData.original_language || '',
          ...(type === 'movie' 
            ? { 
                title: detailData.title || '', 
                original_title: detailData.original_title || '',
                release_date: detailData.release_date || '' 
              }
            : { 
                name: detailData.name || '', 
                original_name: detailData.original_name || '',
                first_air_date: detailData.first_air_date || '' 
              })
        };
        setContent(basicContent as Movie | TVShow);
      } catch (error) {
        console.error('Failed to fetch content:', error);
        setError('Failed to load content details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, type]);

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (error || !content) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Result
            status="error"
            title="Failed to Load Content"
            subTitle={error || 'The content you are looking for could not be found.'}
            extra={
              <Button type="primary" onClick={() => navigate('/')}>
                Back to Home
              </Button>
            }
          />
        </Content>
      </Layout>
    );
  }

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

  const handlePersonSelect = (person: { id: number; name: string }) => {
    // Navigate back to home with person filter
    navigate(`/?person=${person.id}&personName=${encodeURIComponent(person.name)}`);
  };

  const handleBackClick = () => {
    // Navigate back to home
    navigate('/', { replace: false });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ background: '#f5f5f5' }}>
        {/* Header with back button */}
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0,
          right: 0,
          zIndex: 1000, 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0) 100%)',
          padding: '20px 24px 40px'
        }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBackClick}
            size="large"
            style={{ 
              color: 'white', 
              border: 'none',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)'
            }}
          >
            Back
          </Button>
        </div>

        {/* Hero Section with Backdrop */}
        <div style={{ 
          position: 'relative', 
          height: '100vh',
          background: backdropUrl 
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${backdropUrl})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            maxWidth: '1200px',
            width: '100%',
            padding: '0 24px',
            textAlign: 'center'
          }}>
            <Row gutter={[48, 48]} align="middle">
              {/* Poster */}
              <Col xs={24} md={8} style={{ textAlign: 'center' }}>
                {getImageUrl(content.poster_path, 'w500') ? (
                  <Image
                    src={getImageUrl(content.poster_path, 'w500')}
                    alt={title}
                    style={{ 
                      borderRadius: '20px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                      maxWidth: '300px',
                      width: '100%'
                    }}
                    preview={false}
                  />
                ) : (
                  <div style={{
                    width: '300px',
                    height: '450px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto'
                  }}>
                    <PlayCircleOutlined style={{ fontSize: '80px', color: 'rgba(255,255,255,0.5)' }} />
                  </div>
                )}
              </Col>

              {/* Content Info */}
              <Col xs={24} md={16}>
                <div style={{ textAlign: 'left' }}>
                  <Title 
                    level={1} 
                    style={{ 
                      color: 'white', 
                      fontSize: 'clamp(2rem, 5vw, 4rem)',
                      fontWeight: 'bold',
                      marginBottom: '16px',
                      textShadow: '2px 2px 8px rgba(0,0,0,0.8)'
                    }}
                  >
                    {title}
                  </Title>

                  {/* Year and Genres */}
                  <Space wrap size="large" style={{ marginBottom: '24px' }}>
                    <Tag 
                      color="gold" 
                      style={{ 
                        fontSize: '16px', 
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      {year}
                    </Tag>
                    {contentGenres.slice(0, 3).map(genre => (
                      <Tag 
                        key={genre.id} 
                        style={{ 
                          fontSize: '14px', 
                          padding: '6px 14px',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: '500'
                        }}
                      >
                        {genre.name}
                      </Tag>
                    ))}
                  </Space>

                  {/* Rating */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      background: 'rgba(255,193,7,0.2)',
                      padding: '12px 20px',
                      borderRadius: '30px',
                      border: '2px solid #ffc107',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <StarFilled style={{ color: '#ffc107', fontSize: '20px' }} />
                      <Text style={{ 
                        color: 'white', 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>
                        {rating.toFixed(1)}
                      </Text>
                    </div>
                    <Rate 
                      disabled 
                      value={rating / 2} 
                      allowHalf 
                      style={{ color: '#ffc107', fontSize: '20px' }}
                    />
                  </div>

                  {/* Overview */}
                  {content.overview && (
                    <div style={{
                      background: 'rgba(0,0,0,0.6)',
                      padding: '24px',
                      borderRadius: '16px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Text style={{ 
                        color: 'white', 
                        fontSize: '16px', 
                        lineHeight: '1.6',
                        display: 'block'
                      }}>
                        {content.overview}
                      </Text>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* Details Section */}
        <div style={{ 
          background: '#f5f5f5',
          padding: '80px 24px',
          minHeight: '50vh'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Title 
              level={2} 
              style={{ 
                color: '#1f1f1f', 
                textAlign: 'center',
                marginBottom: '48px',
                fontSize: '2.5rem'
              }}
            >
              Details
            </Title>

            <Row gutter={[48, 32]}>
              <Col xs={24} md={12}>
                <Card
                  style={{
                    background: 'white',
                    border: '1px solid #e8e8e8',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  bodyStyle={{ padding: '32px' }}
                >
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontSize: '16px' }}>Type</Text>
                      <Text style={{ color: '#1f1f1f', fontSize: '16px', fontWeight: 'bold' }}>
                        {type === 'movie' ? 'Movie' : 'TV Show'}
                      </Text>
                    </div>
                    <Divider style={{ background: '#f0f0f0', margin: '0' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontSize: '16px' }}>Release Date</Text>
                      <Text style={{ color: '#1f1f1f', fontSize: '16px', fontWeight: 'bold' }}>
                        <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        {releaseDate ? new Date(releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'N/A'}
                      </Text>
                    </div>
                    <Divider style={{ background: '#f0f0f0', margin: '0' }} />

                    {details?.runtime && isMovie(content) && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: '16px' }}>Runtime</Text>
                          <Text style={{ color: '#1f1f1f', fontSize: '16px', fontWeight: 'bold' }}>
                            <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            {Math.floor(details.runtime / 60)}h {details.runtime % 60}m
                          </Text>
                        </div>
                        <Divider style={{ background: '#f0f0f0', margin: '0' }} />
                      </>
                    )}

                    {details?.number_of_seasons && !isMovie(content) && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: '16px' }}>Seasons</Text>
                          <Text style={{ color: '#1f1f1f', fontSize: '16px', fontWeight: 'bold' }}>
                            {details.number_of_seasons}
                          </Text>
                        </div>
                        <Divider style={{ background: '#f0f0f0', margin: '0' }} />
                      </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#666', fontSize: '16px' }}>Language</Text>
                      <Text style={{ color: '#1f1f1f', fontSize: '16px', fontWeight: 'bold' }}>
                        {content.original_language?.toUpperCase() || 'N/A'}
                      </Text>
                    </div>

                    {details?.status && (
                      <>
                        <Divider style={{ background: '#f0f0f0', margin: '0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: '16px' }}>Status</Text>
                          <Tag 
                            color={details.status === 'Released' ? 'green' : 'blue'}
                            style={{ 
                              fontSize: '14px',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {details.status}
                          </Tag>
                        </div>
                      </>
                    )}

                    <Divider style={{ background: '#f0f0f0', margin: '0' }} />
                    
                    {/* Genres */}
                    <div>
                      <Text style={{ color: '#666', fontSize: '16px', display: 'block', marginBottom: '12px' }}>Genres</Text>
                      <Space wrap size="small">
                        {contentGenres.map(genre => (
                          <Tag 
                            key={genre.id}
                            style={{
                              background: '#1890ff',
                              color: 'white',
                              border: 'none',
                              fontSize: '12px',
                              padding: '4px 12px',
                              borderRadius: '16px',
                              fontWeight: '500'
                            }}
                          >
                            {genre.name}
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {/* IMDb Link */}
                    {details?.external_ids?.imdb_id && (
                      <>
                        <Divider style={{ background: '#f0f0f0', margin: '0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#666', fontSize: '16px' }}>IMDb Link</Text>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => window.open(getIMDbUrl(details.external_ids!.imdb_id!), '_blank')}
                            style={{
                              background: '#1890ff',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 500,
                            }}
                          >
                            View on IMDb
                          </Button>
                        </div>
                      </>
                    )}
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                {/* Cast & Crew Section */}
                {details?.credits?.cast && details.credits.cast.length > 0 ? (
                  <Card
                    title="Cast & Crew"
                    style={{
                      background: 'white',
                      border: '1px solid #e8e8e8',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: 24 }}
                    headStyle={{ background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}
                  >
                    <Tabs
                      defaultActiveKey="cast"
                      size="small"
                      items={[
                        {
                          key: 'cast',
                          label: 'Cast',
                          children: (
                            <Row gutter={[12, 12]}>
                              {details.credits.cast.slice(0, 8).map((person) => (
                                <Col xs={12} sm={6} key={person.id}>
                                  <Card
                                    hoverable
                                    onClick={() => handlePersonSelect({ id: person.id, name: person.name })}
                                    style={{
                                      background: 'white',
                                      border: '1px solid #e8e8e8',
                                      borderRadius: 8,
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                    bodyStyle={{ padding: 8, textAlign: 'center' }}
                                    cover={
                                      person.profile_path ? (
                                        <Image
                                          src={getImageUrl(person.profile_path, 'w200')}
                                          alt={person.name}
                                          style={{ 
                                            height: 120, 
                                            objectFit: 'cover',
                                            borderRadius: '8px 8px 0 0'
                                          }}
                                          preview={false}
                                        />
                                      ) : (
                                        <Avatar size={60} style={{ margin: '15px auto', display: 'block' }}>
                                          {person.name.charAt(0)}
                                        </Avatar>
                                      )
                                    }
                                  >
                                    <div style={{ color: '#1f1f1f', fontSize: 11, fontWeight: 500 }}>
                                      {person.name}
                                    </div>
                                    <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>
                                      {person.character}
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          ),
                        },
                        {
                          key: 'crew',
                          label: 'Crew',
                          children: details?.credits?.crew && details.credits.crew.length > 0 ? (
                            <Row gutter={[12, 12]}>
                              {details.credits.crew
                                .filter((person) => ['Director', 'Producer', 'Writer', 'Screenplay'].includes(person.job))
                                .slice(0, 8)
                                .map((person, index) => (
                                  <Col xs={12} sm={6} key={`${person.id}-${index}`}>
                                    <Card
                                      hoverable
                                      onClick={() => handlePersonSelect({ id: person.id, name: person.name })}
                                      style={{
                                        background: 'white',
                                        border: '1px solid #e8e8e8',
                                        borderRadius: 8,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                      }}
                                      bodyStyle={{ padding: 8, textAlign: 'center' }}
                                      cover={
                                        person.profile_path ? (
                                          <Image
                                            src={getImageUrl(person.profile_path, 'w200')}
                                            alt={person.name}
                                            style={{ 
                                              height: 120, 
                                              objectFit: 'cover',
                                              borderRadius: '8px 8px 0 0'
                                            }}
                                            preview={false}
                                          />
                                        ) : (
                                          <Avatar size={60} style={{ margin: '15px auto', display: 'block' }}>
                                            {person.name.charAt(0)}
                                          </Avatar>
                                        )
                                      }
                                    >
                                      <div style={{ color: '#1f1f1f', fontSize: 11, fontWeight: 500 }}>
                                        {person.name}
                                      </div>
                                      <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>
                                        {person.job}
                                      </div>
                                    </Card>
                                  </Col>
                                ))}
                            </Row>
                          ) : (
                            <div style={{ textAlign: 'center', color: '#666' }}>
                              No crew information available
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
                ) : (
                  <Card
                    style={{
                      background: 'white',
                      border: '1px solid #e8e8e8',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '32px', textAlign: 'center' }}
                  >
                    <Text style={{ color: '#666' }}>No cast information available</Text>
                  </Card>
                )}
              </Col>
            </Row>

            {/* Trailers Section */}
            {trailers.length > 0 && (
              <Card
                title="Trailers"
                style={{
                  marginTop: 32,
                  background: 'white',
                  border: '1px solid #e8e8e8',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: 24 }}
                headStyle={{ background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}
              >
                <Row gutter={[16, 16]}>
                  {trailers.slice(0, 6).map((trailer) => (
                    <Col xs={24} sm={12} md={8} key={trailer.id}>
                      <Card
                        hoverable
                        onClick={() => window.open(getYouTubeUrl(trailer.key), '_blank')}
                        style={{
                          background: 'white',
                          border: '1px solid #e8e8e8',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        bodyStyle={{ padding: 12 }}
                        cover={
                          <div style={{ position: 'relative' }}>
                            <Image
                              src={getYouTubeThumbnail(trailer.key)}
                              alt={trailer.name}
                              style={{ 
                                width: '100%',
                                height: 150,
                                objectFit: 'cover',
                                borderRadius: '12px 12px 0 0'
                              }}
                              preview={false}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                fontSize: 36,
                                color: 'white',
                                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                              }}
                            >
                              ▶
                            </div>
                          </div>
                        }
                      >
                        <div style={{ color: '#1f1f1f', fontSize: 14, fontWeight: 500 }}>
                          {trailer.name}
                        </div>
                        <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                          {trailer.type}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}

            {/* Watch Providers Section */}
            {watchProviders && (
              <Card
                title="Where to Watch"
                style={{
                  marginTop: 32,
                  background: 'white',
                  border: '1px solid #e8e8e8',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                bodyStyle={{ padding: 24 }}
                headStyle={{ background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                    <div>
                      <div style={{ color: '#1f1f1f', fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                        Stream
                      </div>
                      <Space wrap>
                        {watchProviders.flatrate.map((provider: any) => (
                          <Card
                            key={provider.provider_id}
                            hoverable
                            style={{
                              background: 'white',
                              border: '1px solid #e8e8e8',
                              borderRadius: 8,
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            bodyStyle={{ padding: 8, textAlign: 'center' }}
                          >
                            <Image
                              src={getImageUrl(provider.logo_path, 'w200')}
                              alt={provider.provider_name}
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                              preview={false}
                            />
                            <div style={{ color: '#1f1f1f', fontSize: 10, marginTop: 4 }}>
                              {provider.provider_name}
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </div>
                  )}

                  {watchProviders.rent && watchProviders.rent.length > 0 && (
                    <div>
                      <div style={{ color: '#1f1f1f', fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                        Rent
                      </div>
                      <Space wrap>
                        {watchProviders.rent.map((provider: any) => (
                          <Card
                            key={provider.provider_id}
                            hoverable
                            style={{
                              background: 'white',
                              border: '1px solid #e8e8e8',
                              borderRadius: 8,
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            bodyStyle={{ padding: 8, textAlign: 'center' }}
                          >
                            <Image
                              src={getImageUrl(provider.logo_path, 'w200')}
                              alt={provider.provider_name}
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                              preview={false}
                            />
                            <div style={{ color: '#1f1f1f', fontSize: 10, marginTop: 4 }}>
                              {provider.provider_name}
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </div>
                  )}

                  {watchProviders.buy && watchProviders.buy.length > 0 && (
                    <div>
                      <div style={{ color: '#1f1f1f', fontSize: 16, fontWeight: 500, marginBottom: 12 }}>
                        Buy
                      </div>
                      <Space wrap>
                        {watchProviders.buy.map((provider: any) => (
                          <Card
                            key={provider.provider_id}
                            hoverable
                            style={{
                              background: 'white',
                              border: '1px solid #e8e8e8',
                              borderRadius: 8,
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            bodyStyle={{ padding: 8, textAlign: 'center' }}
                          >
                            <Image
                              src={getImageUrl(provider.logo_path, 'w200')}
                              alt={provider.provider_name}
                              style={{ width: 60, height: 60, borderRadius: 8 }}
                              preview={false}
                            />
                            <div style={{ color: '#1f1f1f', fontSize: 10, marginTop: 4 }}>
                              {provider.provider_name}
                            </div>
                          </Card>
                        ))}
                      </Space>
                    </div>
                  )}
                </Space>
              </Card>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
};
