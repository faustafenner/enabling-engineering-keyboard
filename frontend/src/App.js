import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Input from './Input';
import Display from './Display';
import Success from './Success';
import Stats from './Stats';

function App() {
  const [isLoading, setIsLoading] = useState('setup'); // 'setup', 'priming', or 'done'
  const [selectedColor, setSelectedColor] = useState(() => {
    const saved = localStorage.getItem("ledColor");
    return saved || "#00FF00";
  });

  const startPriming = async () => {
    setIsLoading('priming');
    
    try {
      // Save the selected color to localStorage
      localStorage.setItem("ledColor", selectedColor);
      
      // Turn off all lights first
      await fetch('http://localhost:5050/lights_off', { method: 'POST' });
      console.log('Requested lights off on app load');
      
      // Bind all regions with the selected color
      await fetch('http://localhost:5050/bind_regions_color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: selectedColor })
      });
      console.log('Bound regions with selected color');
      
      // Prime keyboard with all keys using the selected color
      console.log('Starting keyboard priming...');
      const allKeys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !@#$%^&*()_+-=[]{}|;':\",./<>?`~";
      
      for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        await fetch('http://localhost:5050/lights_on_key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: key,
            color: selectedColor,
            duration: 0.05
          })
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Turn all lights off after priming
      await fetch('http://localhost:5050/lights_off', { method: 'POST' });
      console.log('Keyboard priming complete');
    } catch (err) {
      console.error('Failed to initialize keyboard:', err);
    } finally {
      setIsLoading('done');
    }
  };

  if (isLoading === 'setup') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        color: '#fff',
        fontSize: '24px',
        gap: '30px'
      }}>
        <h1>Select LED Color</h1>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
          style={{
            width: '200px',
            height: '60px',
            cursor: 'pointer',
            border: 'none',
            borderRadius: '8px'
          }}
        />
        <button
          onClick={startPriming}
          style={{
            padding: '12px 32px',
            fontSize: '18px',
            backgroundColor: '#2196f3',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Start
        </button>
      </div>
    );
  }

  if (isLoading === 'priming') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        color: '#fff',
        fontSize: '24px'
      }}>
        <div>Keyboard Loading</div>
        <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
          <span className="dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0s' }}>.</span>
          <span className="dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}>.</span>
          <span className="dot" style={{ animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}>.</span>
        </div>
        <style>{
          `@keyframes blink {
            0%, 20%, 50%, 80%, 100% { opacity: 0; }
            40% { opacity: 1; }
          }`
        }</style>
      </div>
    );
  }

  // isLoading === 'done'
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Input />} />
        <Route path="/display" element={<Display />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
