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
  const [contentSections, setContentSections] = useState(() => {
    const saved = localStorage.getItem("contentSections");
    return saved ? JSON.parse(saved) : [];
  });

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

  // fireworks: parent pushes fireworks here
  const [fireworks, setFireworks] = useState([]);

  const progressFillRef = useRef(null);
  const wordContainerRef = useRef(null);

  // ----------------- AUTOSCALE FONT SIZE -----------------
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!currentSection) return;

    const container = wordContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth - 8;
    const longestWordLength = Math.max(
      ...currentSection.split(/\s+/).map((w) => w.length)
    );

    const estimateChar = (f) => f * 1.25;
    const needed = estimateChar(fontSize) * longestWordLength;

    if (needed <= containerWidth) {
      setEffectiveFontSize(fontSize);
    } else {
      const scaled = Math.max(24, Math.floor(fontSize * (containerWidth / needed)));
      setEffectiveFontSize(scaled);
    }
  }, [currentSection, fontSize, viewportWidth]);

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

      // 阻止空格键导致的页面滚动
      if (e.key === " ") {
        e.preventDefault();
      }

      if (e.key === currentSection[currentLetterIndex]) {
        const next = currentLetterIndex + 1;
        setCurrentLetterIndex(next);
        updateProgressBar(next, currentSection.length);

        if (next === currentSection.length) {
          setSectionCompleted(true);

          // 生成5个烟花而不是1个
          const newFireworks = [];
          const baseX = window.innerWidth / 2;
          const baseY = window.innerHeight * 0.1;
          
          // 中间烟花
          newFireworks.push({
            id: Date.now(),
            targetX: baseX,
            targetY: baseY,
          });
          
          // 左侧烟花
          newFireworks.push({
            id: Date.now() + 1,
            targetX: baseX - 200,
            targetY: baseY + 50,
          });
          
          // 右侧烟花
          newFireworks.push({
            id: Date.now() + 2,
            targetX: baseX + 200,
            targetY: baseY + 50,
          });
          
          // 左上烟花
          newFireworks.push({
            id: Date.now() + 3,
            targetX: baseX - 150,
            targetY: baseY - 50,
          });
          
          // 右上烟花
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
  }, [currentSection, currentLetterIndex, sectionCompleted]);

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

      {/* Fireworks Overlay */}
      <FireworkCanvas fireworks={fireworks} />

      {/* Word Display */}
      <div ref={wordContainerRef}>
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
