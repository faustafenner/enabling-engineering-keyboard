import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Display.css';

function Display() {
  const [currentSection, setCurrentSection] = useState(""); //state for the current section of text being displayed
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0); //state for the index of the current letter the user should type
  const [sectionCompleted, setSectionCompleted] = useState(false); //state to track if the current section is completed
  
  //state for all content sections (array of strings)
  const [contentSections, setContentSections] = useState(() => {
    const saved = localStorage.getItem("contentSections");
    return saved ? JSON.parse(saved) : [];
  });

  //state for the index of the current section
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem("currentIndex");
    return saved ? Number(saved) : 0;
  });

  //ref for the progress bar fill element
  const progressFillRef = useRef(null);
  // React Router navigation hook
  const navigate = useNavigate();



  // Function to light up the current letter key on the keyboard
  function updateCurrentLetterLighting(letter) {
    if (!letter) return;

    // Send POST request to backend to light the key
    fetch("http://localhost:5050/lights_on_key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: letter,
          color: "#00FF00", //just green for now, can change this later
          duration: 2 //duration of 2 seconds for now, can change this later
        })
      })
      .catch(err => console.error("Error lighting key:", err));
  }

  // useEffect to update section and light first letter when section changes
  useEffect(() => {
    if (contentSections.length > 0 && currentIndex < contentSections.length) {
      const section = contentSections[currentIndex];
      setCurrentSection(section);
      setCurrentLetterIndex(0);
      setSectionCompleted(false);
      updateProgressBar(0, section.length);

      // Light up first letter of new section
      if (section.length > 0) {
        const firstLetter = section[0];
        updateCurrentLetterLighting(firstLetter);
      }
    }
  }, [contentSections, currentIndex]);

  // Handler for user input in the letter input box
  function handleLetterInput(e) {
    const value = e.target.value;
    if (!currentSection) return;

    // If the typed letter matches the current letter
    if (value === currentSection[currentLetterIndex]) {
      const nextIndex = currentLetterIndex + 1;
      setCurrentLetterIndex(nextIndex);
      updateProgressBar(nextIndex, currentSection.length);

      // Light up next letter if there is one
      if (nextIndex < currentSection.length) {
        const nextLetter = currentSection[nextIndex];
        updateCurrentLetterLighting(nextLetter);  // <- this line sends correct key
      } else {
        // Section done, mark as completed
        setSectionCompleted(true);
        // Optionally, turn off lights here if desired
        //fetch("http://localhost:5050/lights_off", { method: "POST" });  //commented out for now you tech dont need this
      }
    }

    // Clear input box after each input
    e.target.value = "";
  }

  // Update the progress bar width based on current progress
  function updateProgressBar(current, total) {
    if (progressFillRef.current) {
      const progress = total > 0 ? (current / total) * 100 : 0;
      progressFillRef.current.style.width = `${progress}%`;
    }
  }

  // Move to the next section if available
  function nextSection() {
    if (currentIndex + 1 < contentSections.length) {
      setCurrentIndex(currentIndex + 1);
      setSectionCompleted(false);
    }
  }

  // Navigate back to the input area
  function goBack() {
    navigate("/");
  }

  // Main render
  return (
    <div>
      <div className="navbar">
        {/* Navigation buttons */}
        <button className="nav-btn" onClick={goBack}>Input Area</button>
        <button className="nav-btn" disabled>Display Area</button>
      </div>
      <div className="container">
        <h1>Word Display GUI - Display Area</h1>
        <div className="instructions">
          <p><strong>Instructions:</strong> Type the highlighted letter in the input box below. The content will update as you type.</p>
        </div>
        <div id="wordContainer">
          {/* Display the current section, highlighting the current and correct letters */}
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
