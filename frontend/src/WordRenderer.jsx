import React, { useRef, useEffect } from "react";

export default function WordRenderer({
  currentSection,
  currentLetterIndex,
  effectiveFontSize,
}) {
  const letterRefs = useRef([]);

  useEffect(() =>
    letterRefs.current[currentLetterIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    })
  , [currentLetterIndex, currentSection]);

  // Split content into words and render each word on its own row
  const words = currentSection.split(" ");
  let charIdx = 0;

  return (
    <div style={{
      margin: 0,
      padding: '20px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      gap: '16px'
    }}>
      {words.map((word, wordIdx) => {
        const wordStart = charIdx;
        charIdx += word.length + 1; // +1 for the space

        return (
          <div
            key={wordIdx}
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              overflowX: 'auto',
              padding: '8px'
            }}
          >
            {word.split("").map((char, charInWordIdx) => {
              const absoluteIdx = wordStart + charInWordIdx;
              const isCurrent = absoluteIdx === currentLetterIndex;
              const isCorrect = absoluteIdx < currentLetterIndex;

              return (
                <span
                  key={`${wordIdx}-${charInWordIdx}`}
                  ref={(el) => (letterRefs.current[absoluteIdx] = el)}
                  style={{
                    minWidth: effectiveFontSize * 0.65 + "px",
                    padding: `${effectiveFontSize * 0.18}px ${effectiveFontSize * 0.22}px`,
                    margin: effectiveFontSize * 0.08 + "px",
                    fontSize: effectiveFontSize,
                    background: isCorrect ? "#28a745" : isCurrent ? "#ff9800" : "#181818",
                    color: "#fff",
                    borderRadius: effectiveFontSize * 0.25 + "px",
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    wordBreak: 'keep-all'
                  }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
