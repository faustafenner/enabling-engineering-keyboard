import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Input from './Input';
import Display from './Display';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Input />} />
        <Route path="/display" element={<Display />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
