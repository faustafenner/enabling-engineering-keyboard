 import React, { useState } from 'react';

function TypingGame() {
  const targetWord = "apple";
  const [typedWord, setTypedWord] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = (e) => {
    const key = e.key;
    if (key.length === 1) { // ignore Shift, Ctrl, etc.
      const correctLetter = targetWord[currentIndex];
      const isCorrect = key.toLowerCase() === correctLetter;

      setTypedWord(prev => prev + key);
      setCurrentIndex(prev => prev + 1);

      if (currentIndex + 1 === targetWord.length) {
        alert("Word completed!");
        setTypedWord("");
        setCurrentIndex(0);
      }
    }
  };

  return (
    <div
      tabIndex="0"
      onKeyDown={handleKeyDown}
      style={{
        outline: "none",
        fontFamily: "sans-serif",
        fontSize: "24px",
        margin: "50px"
      }}
    >
      <h2>Type this word:</h2>
      <p style={{ letterSpacing: "5px" }}>{targetWord}</p>
      <h3>Typed so far:</h3>
      <p>{typedWord}</p>
    </div>
  );
}

export default TypingGame;
