import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoStatsChart, IoInformationCircleOutline } from "react-icons/io5";
import "./Input.css";

function Input() {
  const navigate = useNavigate();
  const [wordInput, setWordInput] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [color, setColor] = useState(() => {
    const saved = localStorage.getItem("ledColor");
    return saved || "#00FF00";
  });
  const previousColorRef = useRef(color);
  const [keyToLight, setKeyToLight] = useState("");
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("fontSize");
    return saved ? Number(saved) : 120;
  });
  const [lightingMode, setLightingMode] = useState(() => {
    const saved = localStorage.getItem("lightingMode");
    return saved || "individual";
  });
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const progressFillRef = useRef(null);

  // Persist settings to localStorage
  useEffect(() => {
    // Check if this is a real color change (not initial mount)
    const isColorChange = previousColorRef.current !== color && previousColorRef.current !== undefined;
    
    localStorage.setItem("ledColor", color);
    
    // If color changed by user, trigger re-priming by reloading the app
    if (isColorChange) {
      window.location.reload();
    }
    
    // Update the ref for next comparison
    previousColorRef.current = color;
  }, [color]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("lightingMode", lightingMode);
  }, [lightingMode]);

  function createWordList() {
    const paragraphs = wordInput
      .split("\n")
      .filter((paragraph) => paragraph.trim() !== "");
    let sections = [];
    paragraphs.forEach((paragraph) => {
      if (paragraph.length <= 100) {
        sections.push(paragraph);
      } else {
        const words = paragraph.split(" ");
        let section = "";
        for (const word of words) {
          const testSection = section === "" ? word : section + " " + word;
          if (testSection.length <= 100) {
            section = testSection;
          } else {
            if (section !== "") {
              sections.push(section);
            }
            if (word.length > 100) {
              for (let i = 0; i < word.length; i += 100) {
                sections.push(word.substring(i, i + 100));
              }
              section = "";
            } else {
              section = word;
            }
          }
        }
        if (section !== "") {
          sections.push(section);
        }
      }
    });

    localStorage.setItem("contentSections", JSON.stringify(sections));
    localStorage.setItem("currentIndex", 0);
    localStorage.setItem("currentSection", "");
    localStorage.setItem("currentLetterIndex", 0);
    localStorage.setItem("sectionCompleted", false);
    // Automatically navigate to the display area after creating the list
    navigate("/display");
  }

  function clearWords() {
    setWordInput("");
    setCurrentSection("");
    setCurrentLetterIndex(0);

    localStorage.removeItem("contentSections");
    localStorage.removeItem("currentIndex");
    localStorage.removeItem("currentSection");
    localStorage.removeItem("currentLetterIndex");
    localStorage.removeItem("sectionCompleted");
  }

  function updateProgressBar() {
    if (currentSection.length > 0 && progressFillRef.current) {
      const progress = (currentLetterIndex / currentSection.length) * 100;
      progressFillRef.current.style.width = `${progress}%`;
    } else if (progressFillRef.current) {
      progressFillRef.current.style.width = "0%";
    }
  }

  function lightKey() {
    fetch("http://localhost:5050/lights_on_key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: keyToLight,
        color: color
        // omit duration so backend keeps it lit until lights_offer
      })
    })
      .then((res) => res.json())
      .then((data) => alert(JSON.stringify(data)))
      .catch((err) => alert("Error: " + err));
  }

  function runTestPy() {
    fetch("http://localhost:5050/run_test", {
      method: "POST"
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Test.py finished!\nSTDOUT:\n" + data.stdout + "\nSTDERR:\n" + data.stderr);
      })
      .catch((err) => alert("Error: " + err));
  }

  return (
    <div>
      {/* top header stays at top across the page */}
      <div className="top-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30, marginBottom: 12 }}>
        <button onClick={() => navigate("/stats")} className="stats-btn" style={{ marginLeft: 25 }} aria-label="Open stats">
          <IoStatsChart size={18} />
        </button>
        <h1 style={{ fontSize: 48 }}>Keyboard Setup Wizard</h1>
        <div></div>
      </div>

      <div className="page-container" style={{ marginTop: 70 }}>
      <div className="left-pane">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <h1>Typing Content</h1>
          <IoInformationCircleOutline 
            size={24} 
            style={{ cursor: 'pointer', color: '#bbb' }}
            onClick={() => setInfoModalOpen(true)}
          />
        </div>
  <div className="pane-container">
          <textarea
            className="input-area"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder={`Enter\ncontent\nlike\nthis`}
          />
  
        
        </div>
          <div className="button-group" style={{ display: "flex", gap: "10px", justifyContent: "center" } }>
            <button className ="start-btn" onClick={createWordList}>Start</button>
            <button className="clear-btn" onClick={clearWords}>
              Clear
            </button>
          </div>
      </div>

      <div className="right-pane">
                <h1>Settings</h1>
        <div className="pane-container">

          <div style={{ marginTop: 12 }}>
            {/* <label style={{ color: "#fff", display: 'block', marginBottom: 6 }}>Font size:</label> */}
            <h1>Font Size</h1>
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                type="button" 
                className={`setting-btn ${fontSize === 80 ? 'active' : ''}`}
                onClick={() => setFontSize(80)}
              >
                Small
              </button>
              <button 
                type="button" 
                className={`setting-btn ${fontSize === 120 ? 'active' : ''}`}
                onClick={() => setFontSize(120)}
              >
                Medium
              </button>
              <button 
                type="button" 
                className={`setting-btn ${fontSize === 160 ? 'active' : ''}`}
                onClick={() => setFontSize(160)}
              >
                Large
              </button>
            </div>
            <small style={{ color: '#bbb' }}></small>
          </div>

          <div style={{ marginTop: 16 }}>
            {/* <label style={{ color: "#fff", display: 'block', marginBottom: 6 }}>LED color:</label> */}
            <h1>LED Color</h1>
            <br />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>

          <div style={{ marginTop: 16 }}>
            {/* <label style={{ color: "#fff", display: 'block', marginBottom: 6 }}>Lighting type:</label> */}
            <h1>Lighting Mode</h1>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setLightingMode("individual")}
                className={`setting-btn ${lightingMode === 'individual' ? 'active' : ''}`}
              >
                Individual
              </button>
              <button
                onClick={() => setLightingMode("regional")}
                className={`setting-btn ${lightingMode === 'regional' ? 'active' : ''}`}
              >
                Regional
              </button>
            </div>
            <small style={{ color: '#bbb', display: 'block', }}></small>
          </div>

        </div>
      </div>
    </div>

    {/* Info Modal */}
    {infoModalOpen && (
      <div 
        className="modal-overlay" 
        onClick={() => setInfoModalOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1400,
        }}
      >
        <div 
          className="modal-panel" 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#121212",
            padding: "30px",
            borderRadius: "10px",
            width: "500px",
            maxWidth: "calc(100% - 32px)",
            boxShadow: "0 6px 24px rgba(0, 0, 0, 0.6)",
            color: "#fff"
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Typing Content Instructions</h2>
          <p style={{ lineHeight: "1.6", marginBottom: "12px" }}>
            Enter the text you want to practice typing. Each line will become a separate word/section.
          </p>
          <p style={{ lineHeight: "1.6", marginBottom: "12px" }}>
            <strong>Tips:</strong>
          </p>
          <ul style={{ lineHeight: "1.8", marginBottom: "16px", paddingLeft: "20px" }}>
            <li>Each line becomes one word or phrase to type</li>
            <li>Press Enter to create a new line</li>
            <li>Longer lines (over 100 characters) will be automatically split</li>
            <li>Empty lines are ignored</li>
          </ul>
          <button 
            onClick={() => setInfoModalOpen(false)}
            style={{
              padding: "8px 20px",
              backgroundColor: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            Got it
          </button>
        </div>
      </div>
    )}
    </div>
  );
}

export default Input;