import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import UrlLocaleSync from './components/UrlLocaleSync';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: 4 }}>
        <Routes>
          <Route path="/" element={<UrlLocaleSync />} />
          <Route path="/:lng" element={<>
            <UrlLocaleSync />
            <Home />
          </>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
