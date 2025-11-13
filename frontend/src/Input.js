import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoStatsChart } from "react-icons/io5";
import "./Input.css";

function Input() {
  const navigate = useNavigate();
  const [wordInput, setWordInput] = useState("");
  const [currentSection, setCurrentSection] = useState("");
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [color, setColor] = useState("#00FF00");
  const [keyToLight, setKeyToLight] = useState("");

  const progressFillRef = useRef(null);

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
        // omit duration so backend keeps it lit until lights_off
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
        <button onClick={() => navigate("/stats")} className="stats-btn" style={{ marginLeft: 8 }} aria-label="Open stats">
          <IoStatsChart size={18} />
        </button>
        <h1 style={{ fontSize: 48 }}>Keyboard Setup Wizard</h1>
        <div></div>
      </div>

      <div className="page-container" style={{ marginTop: 70 }}>
      <div className="left-pane">
        <h1>Typing Content</h1>
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
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "8px" }}>
              <button type="button" className="stats-btn" style={{ marginRight: 8 }}>Small</button>
              <button type="button" className="stats-btn" style={{ marginRight: 8 }}>Medium</button>
              <button type="button" className="stats-btn">Large</button>
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
            <h1>Lighting Type</h1>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "8px" }}>
            <label style={{ color: '#fff', marginRight: 12 }}>
              <input type="radio" name="lightingType" defaultChecked /> Individual
            </label>
            <label style={{ color: '#fff' }}>
              <input type="radio" name="lightingType" /> Regional
            </label>
            <small style={{ color: '#bbb', display: 'block', }}></small>
            </div>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
}

export default Input;