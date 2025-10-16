import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Display.css';

function Display() {
  const [currentSection, setCurrentSection] = useState(""); //state for the current section of text being displayed
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0); //state for the index of the current letter the user should type
  const [sectionCompleted, setSectionCompleted] = useState(false); //state to track if the current section is completed
  const [fontSize, setFontSize] = useState(120);
  
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
          color: "#ffffff", //just white for now, can change this later
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

  /*
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
    */

useEffect(() => {
  const handleKeyPress = (e) => {
    if (!currentSection || sectionCompleted) return;
    const key = e.key;
    if (key.length !== 1) return;

    // Prevent page scroll when spacebar is pressed
    if (key === " ") {
      e.preventDefault();
    }

    if (key === currentSection[currentLetterIndex]) {
      const nextIndex = currentLetterIndex + 1;
      setCurrentLetterIndex(nextIndex);
      updateProgressBar(nextIndex, currentSection.length);

      if (nextIndex < currentSection.length) {
        const nextLetter = currentSection[nextIndex];
        updateCurrentLetterLighting(nextLetter);
      } else {
        setSectionCompleted(true);
      }
    }
  };

  window.addEventListener("keydown", handleKeyPress);
  return () => window.removeEventListener("keydown", handleKeyPress);
}, [currentSection, currentLetterIndex, sectionCompleted]);

// function handleKeyPress(e) {
//   if (!currentSection || sectionCompleted) return;

//   const key = e.key;

//   // Ignore keys like Shift, Control, etc.
//   if (key.length !== 1) return;

//   // If the typed letter matches the current letter
//   if (key === currentSection[currentLetterIndex]) {
//     const nextIndex = currentLetterIndex + 1;
//     setCurrentLetterIndex(nextIndex);
//     updateProgressBar(nextIndex, currentSection.length);

//     // Light up next letter if there is one
//     if (nextIndex < currentSection.length) {
//       const nextLetter = currentSection[nextIndex];
//       updateCurrentLetterLighting(nextLetter);
//     } else {
//       // Section done, mark as completed
//       setSectionCompleted(true);
//     }
//   }
// }

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
    else {
      // All sections completed, go to success page
      navigate("/success");
    }
  }

  // Navigate back to the input area
  function goBack() {
    navigate("/");
  }

  // Main render
  // Ref array for each letter
  const letterRefs = useRef([]);

  useEffect(() => {
    if (letterRefs.current[currentLetterIndex]) {
      letterRefs.current[currentLetterIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });
    }
  }, [currentLetterIndex, currentSection]);

  return (
    <div>
      {/* Font size slider at top */}
      <div style={{ marginBottom: "1em", textAlign: "center" }}>
        <label htmlFor="fontSizeSlider" style={{ marginRight: "1em", color: "#fff" }}>Font Size:</label>
        <input
          id="fontSizeSlider"
          type="range"
          min={100}
          max={200}
          value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))}
          style={{ verticalAlign: "middle" }}
        />
        <span style={{ marginLeft: "1em", fontWeight: "bold", color: "#fff" }}>{fontSize}px</span>
      </div>

      {/* Section progress bar in top left */}
      <div className="section-progress-container">
        <div className="section-progress-bar">
          <div
            className="section-progress-fill"
            style={{ width: contentSections.length > 0 ? ((currentIndex + 1) / contentSections.length) * 100 + '%' : '0%' }}
          ></div>
        </div>
        <div className="section-progress-label">
          Word {contentSections.length > 0 ? currentIndex + 1 : 0} / {contentSections.length}
        </div>
      </div>
      <div className="container">
        {/* <h1>Word Display GUI - Display Area</h1>
        <div className="instructions">
          <p><strong>Instructions:</strong> Type the highlighted letter in the input box below. The content will update as you type.</p>
        </div> */}
        <div id="wordContainer">
          {/* Display the current section, highlighting the current and correct letters */}
          {currentSection ? (
            <p>
              {currentSection.split("").map((char, idx) => {
  // Common style for both space and letter boxes
  const isCurrent = idx === currentLetterIndex;
  const isCorrect = idx < currentLetterIndex;
  const boxStyle = {
    minWidth: fontSize * 0.65 + "px", // width similar to a letter
    padding: fontSize * 0.18 + "px " + fontSize * 0.22 + "px",
    margin: fontSize * 0.08 + "px",
    borderRadius: fontSize * 0.25 + "px",
    display: "inline-block",
    backgroundColor: isCorrect
      ? "#28a745"
      : isCurrent
      ? "#ff9800"
      : "#181818",
    color: "#ffffff",
    fontSize: fontSize + "px",
    fontFamily: 'Mulish, Courier New, monospace, Arial, sans-serif',
    fontWeight: isCurrent ? "bold" : "normal",
    textAlign: "center",
    verticalAlign: "middle",
    lineHeight: fontSize + "px",
    boxSizing: "border-box"
  };
  return (
    <span
      key={idx}
      ref={el => letterRefs.current[idx] = el}
      className={
        isCorrect
          ? "correct"
          : isCurrent
          ? "current"
          : ""
      }
      style={boxStyle}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  );
})}
            </p>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic" }}>
              Content sections will appear here...
            </p>
          )}
        </div>
       
        <div className="button-group">
          {sectionCompleted && (
            <button
              id="nextSectionBtn" 
              className="next-section-btn"
              onClick={nextSection}
            >
              {currentIndex + 1 < contentSections.length ? "Next Word" : "Finish"}
            </button>
          )}
        </div>
        {/* Quit button fixed at bottom left */}
        <button className="quit-btn" onClick={goBack}>Quit</button>
        
      </div>
    </div>
  );
}

export default Display;
