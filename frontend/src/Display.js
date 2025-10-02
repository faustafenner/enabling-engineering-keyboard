import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Display.css';

function Display() {
  const [currentSection, setCurrentSection] = useState("");
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [sectionCompleted, setSectionCompleted] = useState(false);
  const [contentSections, setContentSections] = useState(() => {
    const saved = localStorage.getItem("contentSections");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem("currentIndex");
    return saved ? Number(saved) : 0;
  });

  const progressFillRef = useRef(null);
  const navigate = useNavigate();

  function updateCurrentLetterLighting(letter) {
  if (!letter) return;

  fetch("http://127.0.0.1:5000/lights_on_key", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: letter.toUpperCase(), // SteelSeries expects key names
      color: "#00FF00",          // green highlight
      duration: 1000,             // milliseconds
      interval: 1,
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error("Error lighting key:", err));
}


  useEffect(() => {
  if (contentSections.length > 0 && currentIndex < contentSections.length) {
    const section = contentSections[currentIndex];
    setCurrentSection(section);
    setCurrentLetterIndex(0);
    setSectionCompleted(false);
    updateProgressBar(0, section.length);

    //light up first letter of new section
    if (section.length > 0) {
      const firstLetter = section[0];
      updateCurrentLetterLighting(firstLetter);
    }
  }
}, [contentSections, currentIndex]);


function handleLetterInput(e) {
  const value = e.target.value;
  if (!currentSection) return;

  if (value === currentSection[currentLetterIndex]) {
    const nextIndex = currentLetterIndex + 1;
    setCurrentLetterIndex(nextIndex);
    updateProgressBar(nextIndex, currentSection.length);

    //light up next letter if word not done
    if (nextIndex < currentSection.length) {
      const nextLetter = currentSection[nextIndex];
      updateCurrentLetterLighting(nextLetter);
    } else {
      // turn off lights if section done
      setSectionCompleted(true);
      fetch("http://127.0.0.1:5000/lights_off", { method: "POST" });
    }
  }

  // Clear input box
  e.target.value = "";
}


  function updateProgressBar(current, total) {
    if (progressFillRef.current) {
      const progress = total > 0 ? (current / total) * 100 : 0;
      progressFillRef.current.style.width = `${progress}%`;
    }
  }

  function nextSection() {
    if (currentIndex + 1 < contentSections.length) {
      setCurrentIndex(currentIndex + 1);
      setSectionCompleted(false);
    }
  }

  function goBack() {
    navigate("/");
  }

  return (
    <div>
      <div className="navbar">
        <button className="nav-btn" onClick={goBack}>Input Area</button>
        <button className="nav-btn" disabled>Display Area</button>
      </div>
      <div className="container">
        <h1>Word Display GUI - Display Area</h1>
        <div className="instructions">
          <p><strong>Instructions:</strong> Type the highlighted letter in the input box below. The content will update as you type.</p>
        </div>
        <div id="wordContainer">
          {currentSection ? (
            <p>
              {currentSection.split("").map((char, idx) => (
                <span
                  key={idx}
                  className={
                    idx < currentLetterIndex
                      ? "correct"
                      : idx === currentLetterIndex
                      ? "current"
                      : ""
                  }
                >
                  {char}
                </span>
              ))}
            </p>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic" }}>
              Content sections will appear here...
            </p>
          )}
        </div>
        <div className="input-container">
          <label htmlFor="letterInput">Type the next letter:</label>
          <input
            type="text"
            id="letterInput"
            maxLength={1}
            onChange={handleLetterInput}
            disabled={!currentSection || sectionCompleted}
          />
        </div>
        <div className="button-group">
          <button className="back-btn" onClick={goBack}>Back to Input</button>
          <button
            id="nextSectionBtn"
            className="next-section-btn"
            onClick={nextSection}
            disabled={!sectionCompleted || currentIndex + 1 >= contentSections.length}
          >
            Next Section
          </button>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" id="progressFill" ref={progressFillRef}></div>
        </div>
      </div>
    </div>
  );
}

export default Display;
