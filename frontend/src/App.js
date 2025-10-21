import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Input from './Input';
import Display from './Display';
import Success from './Success';

function App() {
  useEffect(() => {
    fetch('http://localhost:5050/lights_off', { method: 'POST' })
      .then(() => console.log('Requested lights off on app load'))
      .catch(err => console.error('Failed to request lights off:', err));
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Input />} />
        <Route path="/display" element={<Display />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
