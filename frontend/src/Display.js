// Display.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import WordRenderer from "./WordRenderer.jsx";
import SettingsModal from "./SettingsModal.jsx";
import FireworkCanvas from "./FireworkCanvas.jsx";
import { useNavigate } from "react-router-dom";
import "./Display.css";

function Display() {
  const navigate = useNavigate();

  // ----------------- UI / STATES -----------------
  
  // load word list
  const [contentSections, setContentSections] = useState(() => {
    const saved = localStorage.getItem("contentSections");
    return saved ? JSON.parse(saved) : [];
  });

  // load index
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem("currentIndex");
    return saved ? Number(saved) : 0;
  });

  const [currentSection, setCurrentSection] = useState("");
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [sectionCompleted, setSectionCompleted] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(120);
  const [effectiveFontSize, setEffectiveFontSize] = useState(fontSize);
  const [lightingMode, setLightingMode] = useState("individual");
  const [fullTextModalOpen, setFullTextModalOpen] = useState(false);
  const [fireworks, setFireworks] = useState([]);

  const progressFillRef = useRef(null);
  const wordContainerRef = useRef(null);

  // Set fixed font size without auto-scaling
  useEffect(() => {
    setEffectiveFontSize(fontSize);
  }, [fontSize]);

  // Reset lights when Display component mounts (app startup only)
  useEffect(() => {
    fetch("http://localhost:5050/lights_off", { method: "POST" })
      .then(() => console.log("Reset keyboard lights on Display load"))
      .catch(err => console.error("Error resetting lights:", err));
  }, []);

  // Light up a key on the keyboard (individual or region mode)
  const lightKey = useCallback((key) => {
    const endpoint = lightingMode === "region" 
      ? "http://localhost:5050/lights_on_region_for_key"
      : "http://localhost:5050/lights_on_key";
    
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: key === ' ' ? ' ' : key,
        color: "#ffffff",
        duration: 3600  // 1 hour - effectively stays lit until next key pressed
      })
    }).catch(err => console.error("Error lighting key:", err));
  }, [lightingMode]);

  // Turn off a key on the keyboard (individual or region mode)
  const turnOffKey = useCallback((key) => {
    const endpoint = lightingMode === "region"
      ? "http://localhost:5050/lights_off_region_for_key"
      : "http://localhost:5050/lights_off_key";
    
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: key === ' ' ? ' ' : key
      })
    }).catch(err => console.error("Error turning off key:", err));
  }, [lightingMode]);

  // Reset all keyboard lights
  const resetKeyLights = useCallback(() => {
    fetch("http://localhost:5050/lights_off", { method: "POST" })
      .then(() => console.log("Keyboard lights reset"))
      .catch(err => console.error("Error resetting lights:", err));
  }, []);


  // Keep track of the previous section for smooth transitions
  const previousSectionRef = useRef("");

  // ----------------- LOAD CURRENT SECTION -----------------
  useEffect(() => {
    if (contentSections.length === 0) return;
    const section = contentSections[currentIndex];
    setCurrentSection(section);
    setCurrentLetterIndex(0);
    setSectionCompleted(false);
    updateProgressBar(0, section.length);
    
    // Turn off the first key of the previous section to avoid flashing
    if (previousSectionRef.current && previousSectionRef.current.length > 0) {
      turnOffKey(previousSectionRef.current[0]);
      
      // Add small delay before lighting the new key to prevent timing race conditions
      setTimeout(() => {
        if (section.length > 0) {
          lightKey(section[0]);
          previousSectionRef.current = section;
        }
      }, 50);
    } else {
      // If no previous section, light immediately
      if (section.length > 0) {
        lightKey(section[0]);
        previousSectionRef.current = section;
      }
    }
  }, [contentSections, currentIndex, lightKey, turnOffKey]);

  // ----------------- KEYBOARD INPUT -----------------
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!currentSection || sectionCompleted) return;
      if (e.key.length !== 1) return;

      if (e.key === " ") {
        e.preventDefault();
      }

      if (e.key === currentSection[currentLetterIndex]) {
        // Turn off the current key
        turnOffKey(currentSection[currentLetterIndex]);
        
        const next = currentLetterIndex + 1;
        setCurrentLetterIndex(next);
        updateProgressBar(next, currentSection.length);
        
        // Light up the next key (if not at end of section)
        if (next < currentSection.length) {
          const nextKey = currentSection[next];
          lightKey(nextKey);
        }

        if (next === currentSection.length) {
          setSectionCompleted(true);

          const newFireworks = [];
          const baseX = window.innerWidth / 2;
          const baseY = window.innerHeight * 0.1;

          newFireworks.push({
            id: Date.now(),
            targetX: baseX,
            targetY: baseY,
          });

          newFireworks.push({
            id: Date.now() + 1,
            targetX: baseX - 200,
            targetY: baseY + 50,
          });

          newFireworks.push({
            id: Date.now() + 2,
            targetX: baseX + 200,
            targetY: baseY + 50,
          });

          newFireworks.push({
            id: Date.now() + 3,
            targetX: baseX - 150,
            targetY: baseY - 50,
          });

          newFireworks.push({
            id: Date.now() + 4,
            targetX: baseX + 150,
            targetY: baseY - 50,
          });

          setFireworks((prev) => [
            ...prev,
            ...newFireworks,
          ]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSection, currentLetterIndex, sectionCompleted, lightingMode, lightKey, turnOffKey]);

  // ----------------- PROGRESS BAR -----------------
  const updateProgressBar = (current, total) => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${(current / total) * 100}%`;
    }
  };

  // ----------------- BUTTON ACTIONS -----------------
  const goNextSection = () => {
    if (currentIndex + 1 < contentSections.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate("/success");
    }
  };

  const goBack = () => navigate("/");

  // ----------------- RENDER -----------------
  return (
    <div className="display-wrapper">
      {/* Progress Bar */}
      <div className="section-progress-container">
        <div className="section-progress-bar">
          <div ref={progressFillRef} className="section-progress-fill"></div>
        </div>
        <div className="section-progress-label">
          Word {currentIndex + 1} / {contentSections.length}
        </div>
      </div>

      {/* Full Text Preview Modal */}
      {fullTextModalOpen && (
        <div className="modal-overlay" onClick={() => setFullTextModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Current Text</h3>
            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{currentSection}</p>
            <button onClick={() => setFullTextModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Fireworks Overlay */}
      <FireworkCanvas fireworks={fireworks} />

      {/* Word Display */}
            {/* Word Display - Center container */}
      <div ref={wordContainerRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', width: '100%', overflow: 'visible' }}>
        <WordRenderer
          currentSection={currentSection}
          currentLetterIndex={currentLetterIndex}
          effectiveFontSize={effectiveFontSize}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        {sectionCompleted && (
          <button className="next-section-btn" onClick={goNextSection}>
            {currentIndex + 1 < contentSections.length ? "Next Word" : "Finish"}
          </button>
        )}
      </div>

      <button className="quit-btn" onClick={goBack} style={{ position: 'fixed', bottom: '20px', left: '20px' }}>
        Quit
      </button>

      <button className="settings-top-btn" onClick={() => setSettingsOpen(true)}>
        Settings
      </button>

      <button 
        className="settings-top-btn" 
        onClick={() => setFullTextModalOpen(true)}
        style={{ right: '140px' }}
      >
        Show Full Text
      </button>

      {/* Modal */}
      {settingsOpen && (
        <SettingsModal
          fontSize={fontSize}
          setFontSize={setFontSize}
          lightingMode={lightingMode}
          setLightingMode={setLightingMode}
          resetKeyLights={resetKeyLights}
          close={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default Display;
