import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Config from './pages/Config';
import Interview from './pages/Interview';
import Plan from './pages/Plan';
import RunDashboard from './pages/RunDashboard';
import Report from './pages/Report';
import './index.css';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/config" element={<Config />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/plan" element={<Plan />} />
      <Route path="/run/:runId" element={<RunDashboard />} />
      <Route path="/report/:runId" element={<Report />} />
    </Routes>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
