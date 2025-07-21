import { ConfigProvider, theme } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { ContentDetail } from './pages/ContentDetail';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm, // Always use light theme
        token: {
          colorPrimary: '#ff6b6b',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<ContentDetail type="movie" />} />
          <Route path="/tv/:id" element={<ContentDetail type="tv" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
