import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Builder } from './pages/Builder';
import './index.css';
import { Analytics } from '@vercel/analytics/react';


function App() {
  return (
    <BrowserRouter>
       <Analytics />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder" element={<Builder />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
