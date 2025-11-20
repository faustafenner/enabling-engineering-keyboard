// Display.jsx
import React, { useState, useEffect, useRef } from "react";
import WordRenderer from "./WordRenderer";
import SettingsModal from "./SettingsModal";
import FireworkCanvas from "./FireworkCanvas";
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
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved ? Number(saved) : 120;
  });
  const [effectiveFontSize, setEffectiveFontSize] = useState(fontSize);
  const [lightingMode, setLightingMode] = useState(() => {
    const saved = localStorage.getItem("lightingMode");
    return saved || "individual";
  });
  const [fullTextModalOpen, setFullTextModalOpen] = useState(false);
  const [fireworks, setFireworks] = useState([]);

  const progressFillRef = useRef(null);
  const wordContainerRef = useRef(null);

  // Set fixed font size without auto-scaling
  useEffect(() => {
    setEffectiveFontSize(fontSize);
    // Persist fontSize changes to localStorage
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  // Persist lightingMode changes to localStorage
  useEffect(() => {
    localStorage.setItem("lightingMode", lightingMode);
  }, [lightingMode]);

  // ----------------- LOAD CURRENT SECTION -----------------
  useEffect(() => {
    if (contentSections.length === 0) return;
    const section = contentSections[currentIndex];
    setCurrentSection(section);
    setCurrentLetterIndex(0);
    setSectionCompleted(false);
    updateProgressBar(0, section.length);
  }, [contentSections, currentIndex]);

  // ----------------- KEYBOARD INPUT -----------------
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!currentSection || sectionCompleted) return;
      if (e.key.length !== 1) return;

      if (e.key === " ") {
        e.preventDefault();
      }

      if (e.key === currentSection[currentLetterIndex]) {
        const next = currentLetterIndex + 1;
        setCurrentLetterIndex(next);
        updateProgressBar(next, currentSection.length);
        
        const ledColor = localStorage.getItem("ledColor") || "#00FF00";
        fetch("http://localhost:5050/lights_on_key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: e.key === ' ' ? 'SPACE' : e.key.toUpperCase(),
            color: ledColor
          })
        }).catch(err => console.error("Error lighting key:", err));

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
  }, [currentSection, currentLetterIndex, sectionCompleted, lightingMode]);

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
          close={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default Display;
