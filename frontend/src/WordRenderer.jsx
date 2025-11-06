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

  return (
    <p style={{
      margin: 0,
      padding: '20px',
      width: '100%',
      textAlign: 'center',
      wordBreak: 'keep-all',
      whiteSpace: 'normal',
      lineHeight: '1.5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap'
    }}>
      {currentSection.split("").map((char, idx) => {
        const isCurrent = idx === currentLetterIndex;
        const isCorrect = idx < currentLetterIndex;

        return (
          <span
            key={idx}
            ref={(el) => (letterRefs.current[idx] = el)}
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
              wordBreak: 'keep-all',
              whiteSpace: 'nowrap'
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        );
      })}
    </p>
  );
}
