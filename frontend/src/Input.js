import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Input.css";

function Input() {
  const navigate = useNavigate();
  const [wordInput, setWordInput] = useState("");

  const [currentSection, setCurrentSection] = useState("");
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);


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
    if (currentSection.length > 0) {
      const progress = (currentLetterIndex / currentSection.length) * 100;
      progressFillRef.current.style.width = `${progress}%`;
    } else {
      progressFillRef.current.style.width = "0%";
    }
  }

  return (
    <div>
      <div className="navbar">
        <button className="nav-btn" onClick={() => navigate("/")}>
          Input Area
        </button>
        <button className="nav-btn" onClick={() => navigate("/display")}>
          Display Area
        </button>
      </div>
      <div className="container">
        <h1>Word Display GUI - Input Area</h1>
        <div className="instructions">
          <p>
            <strong>Instructions:</strong> Enter content in the input area
            below. Each line should be a separate paragraph. Click "Create List"
            to generate the content sections.
          </p>
          <p>
            <strong>Note:</strong> Long content will be split into sections of
            approximately 100 letters without breaking words.
          </p>
        </div>
        <textarea
          id="wordInput"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          placeholder={`Enter content, each line as a new paragraph\nExample:\nThe quick brown fox jumps over the lazy dog.\nEasy does it.`}
        />
        <div className="button-group">
          <button onClick={createWordList}>Create List</button>
          <button className="clear-btn" onClick={clearWords}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}

export default Input;
