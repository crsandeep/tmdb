import { ConfigProvider, theme } from 'antd';
import { Home } from './pages/Home';

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
      <Home />
    </ConfigProvider>
  );
}

export default App;
