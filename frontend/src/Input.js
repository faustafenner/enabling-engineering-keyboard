import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Input.css';

function Input() {
  const navigate = useNavigate();
  const [wordInput, setWordInput] = useState("");
  const [contentSections, setContentSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState('');
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [sectionCompleted, setSectionCompleted] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  const nextBtnRef = useRef(null);
  const fullscreenBtnRef = useRef(null);
  const letterInputRef = useRef(null);
  const progressFillRef = useRef(null);

  function createWordList() {
    const paragraphs = wordInput.split('\n').filter(paragraph => paragraph.trim() !== '');
    let sections = [];
    paragraphs.forEach(paragraph => {
      if (paragraph.length <= 100) {
        sections.push(paragraph);
      } else {
        const words = paragraph.split(' ');
        let section = '';
        for (const word of words) {
          const testSection = section === '' ? word : section + ' ' + word;
          if (testSection.length <= 100) {
            section = testSection;
          } else {
            if (section !== '') {
              sections.push(section);
            }
            if (word.length > 100) {
              for (let i = 0; i < word.length; i += 100) {
                sections.push(word.substring(i, i + 100));
              }
              section = '';
            } else {
              section = word;
            }
          }
        }
        if (section !== '') {
          sections.push(section);
        }
      }
    });
    setContentSections(sections);
    setCurrentIndex(0);
    setCurrentSection('');
    setCurrentLetterIndex(0);
    setSectionCompleted(false);

    if (sections.length > 0) {
      nextBtnRef.current.disabled = false;
      fullscreenBtnRef.current.disabled = false;
      letterInputRef.current.disabled = true;
    } else {
      nextBtnRef.current.disabled = true;
      fullscreenBtnRef.current.disabled = true;
    }

    localStorage.setItem('contentSections', JSON.stringify(sections));
    localStorage.setItem('currentIndex', 0);
    localStorage.setItem('currentSection', '');
    localStorage.setItem('currentLetterIndex', 0);
    localStorage.setItem('sectionCompleted', false);
  }

  function handleNextButton() {
    localStorage.setItem('currentIndex', currentIndex);
    localStorage.setItem('currentSection', currentSection);
    localStorage.setItem('currentLetterIndex', currentLetterIndex);
    localStorage.setItem('sectionCompleted', sectionCompleted);
    window.location.href = 'display.html';
  }

  function clearWords() {
    setWordInput('');
    setContentSections([]);
    setCurrentIndex(0);
    setCurrentSection('');
    setCurrentLetterIndex(0);
    setSectionCompleted(false);
    setIsFullscreenMode(false);

    nextBtnRef.current.textContent = 'Next Section';
    nextBtnRef.current.disabled = true;
    letterInputRef.current.disabled = true;
    fullscreenBtnRef.current.disabled = true;

    updateProgressBar();
    exitFullscreenMode();

    localStorage.removeItem('contentSections');
    localStorage.removeItem('currentIndex');
    localStorage.removeItem('currentSection');
    localStorage.removeItem('currentLetterIndex');
    localStorage.removeItem('sectionCompleted');
  }

  function updateProgressBar() {
    if (currentSection.length > 0) {
      const progress = (currentLetterIndex / currentSection.length) * 100;
      progressFillRef.current.style.width = `${progress}%`;
    } else {
      progressFillRef.current.style.width = '0%';
    }
  }

  function enterFullscreenMode() {
    setIsFullscreenMode(true);
    document.body.classList.add('fullscreen-mode');
  }

  function exitFullscreenMode() {
    setIsFullscreenMode(false);
    document.body.classList.remove('fullscreen-mode');
  }

  return (
    <div>
      <div className="navbar">
        <button className="nav-btn" onClick={() => navigate("/")}>Input Area</button>
        <button className="nav-btn" onClick={() => navigate("/display")}>Display Area</button>
      </div>
      <div className="container">
        <h1>Word Display GUI - Input Area</h1>
        <div className="instructions">
          <p><strong>Instructions:</strong> Enter content in the input area below. Each line should be a separate paragraph.
            Click "Create List" to generate the content sections.</p>
          <p><strong>Note:</strong> Long content will be split into sections of approximately 100 letters without breaking words.</p>
        </div>
        <textarea
          id="wordInput"
          value={wordInput}
          onChange={e => setWordInput(e.target.value)}
          placeholder={`Enter content, each line as a new paragraph\nExample:\nThe quick brown fox jumps over the lazy dog.\nEasy does it.`}
        />
        <div className="button-group">
          <button onClick={createWordList}>Create List</button>
          <button className="clear-btn" onClick={clearWords}>Clear All</button>
        </div>
        <button
          id="nextBtn"
          className="next-btn"
          onClick={handleNextButton}
          ref={nextBtnRef}
          disabled
        >
          Next Section
        </button>
        <button
          id="fullscreenBtn"
          className="fullscreen-btn"
          onClick={enterFullscreenMode}
          ref={fullscreenBtnRef}
          disabled
        >
          Enter Full Screen
        </button>
        <div className="input-container">
          <label htmlFor="letterInput">Type the next letter:</label>
          <input
            type="text"
            id="letterInput"
            maxLength={1}
            placeholder="Type one letter"
            ref={letterInputRef}
            disabled
          />
        </div>
        <div className="progress-bar">
          <div className="progress-fill" id="progressFill" ref={progressFillRef}></div>
        </div>
      </div>
    </div>
  );
}

export default Input;