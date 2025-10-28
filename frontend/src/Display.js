import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Display.css";

function Display() {
  const [currentSection, setCurrentSection] = useState(""); //state for the current section of text being displayed
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0); //state for the index of the current letter the user should type
  const [sectionCompleted, setSectionCompleted] = useState(false); //state to track if the current section is completed
  const [fontSize, setFontSize] = useState(120);
  // Effective font size (may be reduced automatically to fit long words)
  const [effectiveFontSize, setEffectiveFontSize] = useState(fontSize);
  // Timing tracking: intervals (ms) between consecutive correct key presses
  const [intervals, setIntervals] = useState(() => {
    try {
      const saved = localStorage.getItem("intervals");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const prevPressTimeRef = useRef(null);
  // per-letter stats persisted in localStorage so a refresh does NOT clear them
  const [perLetterStats, setPerLetterStats] = useState(() => {
    try {
      const saved = localStorage.getItem("perLetterStats");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [lightingMode, setLightingMode] = useState("individual"); // "individual" or "region"
  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [testKey, setTestKey] = useState("");
  // Fireworks state
  const [fireworks, setFireworks] = useState([]);
  // Word boundary tracking
  const wordBoundariesRef = useRef([]);

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
  const wordContainerRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  // Recompute effective font size when currentSection, fontSize, or viewport changes
  useEffect(() => {
    function compute() {
      const container = wordContainerRef.current;
      if (!container || !currentSection) {
        setEffectiveFontSize(fontSize);
        return;
      }
      const containerWidth = container.clientWidth - 8; // small padding
      // longest continuous word (no spaces)
      const words = currentSection.split(/\s+/).filter(Boolean);
      const longest =
        words.length > 0
          ? Math.max(...words.map((w) => w.length))
          : currentSection.length;

      // Estimate per-character box width based on how we render boxes:
      // minWidth = f*0.65, horizontal padding = f*0.22, margin each side = f*0.08
      const estimateCharBox = (f) => f * (0.65 + 0.22 * 2 + 0.08 * 2); // = f * (0.65+0.44+0.16)=f*1.25

      const reqWidth = longest * estimateCharBox(fontSize);
      if (reqWidth <= containerWidth) {
        setEffectiveFontSize(fontSize);
      } else {
        const scale = containerWidth / reqWidth;
        const newSize = Math.max(24, Math.floor(fontSize * scale));
        setEffectiveFontSize(newSize);
      }
    }

    compute();
  }, [currentSection, fontSize, viewportWidth]);

  useEffect(() => {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Function to light up the current letter key on the keyboard
  function updateCurrentLetterLighting(letter) {
    if (!letter) return;

    // Branch based on selected lighting mode
    if (lightingMode === "individual") {
      // Send POST request to light a single key
      fetch("http://localhost:5050/lights_on_key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: letter,
          color: "#ffffff",
          // no duration: keep lit until explicitly turned off
        }),
      }).catch((err) => console.error("Error lighting key:", err));
    } else {
      // Region mode: send the letter directly; backend/ssgg will map it if needed
      fetch("http://localhost:5050/lights_on_region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "REGION_EVENT",
          key: letter,
          color: "#ffffff",
          // no duration: keep lit until explicitly turned off
        }),
      }).catch((err) => console.error("Error lighting region:", err));
    }
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

        // Ensure any previous lights are off, then light the first letter so it remains until pressed
        fetch("http://localhost:5050/lights_off", { method: "POST" })
          .then(() => updateCurrentLetterLighting(firstLetter))
          .catch(() => updateCurrentLetterLighting(firstLetter));
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

  // Function to create a firework that launches from top of screen
  const createFirework = (x, y) => {
    const fireworkId = Date.now();
    // Store target position (where the word is)
    setFireworks((prev) => [
      ...prev,
      {
        id: fireworkId,
        targetX: x,
        targetY: y,
        launchTime: Date.now(),
      },
    ]);

    // Remove firework after animation completes (3 seconds total)
    setTimeout(() => {
      setFireworks((prev) =>
        prev.filter((firework) => firework.id !== fireworkId)
      );
    }, 3000);
  };

  // Function to check if a word boundary is reached - kept for future use but not triggering fireworks
  const checkWordCompletion = (index) => {
    // This function is kept for future features but no longer triggers fireworks
    // Fireworks are now triggered when the entire section is completed
  };

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
        // Timing: record interval between this correct press and the previous correct press
        const now = performance.now();
        const letterKey = key.toLowerCase();
        if (prevPressTimeRef.current !== null) {
          const delta = now - prevPressTimeRef.current; // ms
          // append to intervals and keep last 100 entries to avoid unbounded growth
          const next = [...intervals.slice(-99), delta];
          setIntervals(next);
          try {
            localStorage.setItem("intervals", JSON.stringify(next));
          } catch (e) {}

          // Update per-letter stats: add delta to that letter's array (in-memory only)
          setPerLetterStats((prev) => {
            const copy = { ...prev };
            if (!copy[letterKey]) copy[letterKey] = [];
            copy[letterKey] = [...copy[letterKey].slice(-499), delta]; // keep last 500 per letter
            try {
              localStorage.setItem("perLetterStats", JSON.stringify(copy));
            } catch (e) {}
            return copy;
          });
        }
        prevPressTimeRef.current = now;

        const nextIndex = currentLetterIndex + 1;
        setCurrentLetterIndex(nextIndex);
        updateProgressBar(nextIndex, currentSection.length);

        // Removed word-level fireworks, now using section-level fireworks only

        // Do not turn all lights off here. Each key/region call uses a duration
        // so the backend/ssgg will turn it off after the duration elapses.
        // Removing the global lights_off prevents turning off the next letter immediately.

        if (nextIndex < currentSection.length) {
          const nextLetter = currentSection[nextIndex];
          // Turn off previous lights, then light the next letter so it stays lit until pressed
          fetch("http://localhost:5050/lights_off", { method: "POST" })
            .then(() => updateCurrentLetterLighting(nextLetter))
            .catch(() => updateCurrentLetterLighting(nextLetter));
        } else {
          setSectionCompleted(true);
          // Create fireworks when the entire section is completed
          if (wordContainerRef.current) {
            const containerRect =
              wordContainerRef.current.getBoundingClientRect();
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            for (let i = 0; i < 7; i++) {
              const x = screenWidth * 0.5;
              const y = screenHeight * 0.1;
              createFirework(x, y);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSection, currentLetterIndex, sectionCompleted, intervals]);

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
    } else {
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
        inline: "center",
      });
    }
  }, [currentLetterIndex, currentSection]);

  // Canvas-based Firework component using particle system
  const Firework = ({ targetX, targetY }) => {
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const fireworksRef = useRef([]);

    // Particle class for fireworks
    class Particle {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 2 + 1; // Random size
        this.velocity = {
          x: (Math.random() - 0.5) * 8, // Horizontal spread
          y: (Math.random() - 0.5) * 8, // Vertical spread
        };
        this.alpha = 1; // Transparency
        this.gravity = 0.08; // Gravity effect
        this.friction = 0.98; // Friction
      }

      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.globalCompositeOperation = "lighter"; // Additive blending

        // Create radial gradient for particle glow
        const gradient = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.radius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
        gradient.addColorStop(
          0.4,
          `rgba(${this.getColorValues()}, ${this.alpha})`
        );
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Helper method: Convert HSL color to RGB values
      getColorValues() {
        const hsl = this.color.match(/\d+/g);
        if (!hsl) return "255, 255, 255";

        const h = parseInt(hsl[0]);
        const s = parseInt(hsl[1]) / 100;
        const l = parseInt(hsl[2]) / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0,
          g = 0,
          b = 0;

        if (h >= 0 && h < 60) {
          r = c;
          g = x;
          b = 0;
        } else if (h >= 60 && h < 120) {
          r = x;
          g = c;
          b = 0;
        } else if (h >= 120 && h < 180) {
          r = 0;
          g = c;
          b = x;
        } else if (h >= 180 && h < 240) {
          r = 0;
          g = x;
          b = c;
        } else if (h >= 240 && h < 300) {
          r = x;
          g = 0;
          b = c;
        } else {
          r = c;
          g = 0;
          b = x;
        }

        return `${Math.round((r + m) * 255)}, ${Math.round(
          (g + m) * 255
        )}, ${Math.round((b + m) * 255)}`;
      }

      update(wind) {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.velocity.y += this.gravity; // Gravity effect
        this.velocity.y += wind?.y || 0;
        this.velocity.x += wind?.x || 0;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.003; // Fade out
        this.radius += 0.02; // Particles grow slightly
      }
    }

    // Firework class
    class CanvasFirework {
      constructor(x, y) {
        this.x = x;
        this.y = y;

        // 🎨 Choose a random color palette for this explosion
        const palettes = [
          // Neon tones
          [0, 60, 120, 180, 240, 300],
          // Warm reds / oranges
          [10, 25, 40, 55, 70, 85],
          // Cool blues / purples
          [180, 200, 220, 260, 280, 320],
          // Pastel rainbow
          Array.from({ length: 12 }, (_, i) => i * 30),
          // Bright rainbow burst
          Array.from({ length: 24 }, (_, i) => i * 15),
        ];
        this.palette = palettes[Math.floor(Math.random() * palettes.length)];

        // Rocket trail base color
        const baseHue =
          this.palette[Math.floor(Math.random() * this.palette.length)];
        this.color = `hsl(${baseHue}, 100%, 50%)`;

        this.particles = [];
        this.launchPhase = true;
        this.rocketY = window.innerHeight;
        this.targetY = y;
        this.speed = Math.random() * 5 + 8;
        this.wind = { x: (Math.random() - 0.5) * 0.2, y: -0.02 };
        this.exploded = false;
      }

      update() {
        if (this.launchPhase) {
          // 火箭上升阶段
          this.rocketY -= this.speed;

          // 到达目标位置时爆炸
          if (this.rocketY <= this.targetY) {
            this.explode();
          }
          return true;
        } else {
          // 更新所有粒子
          for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(this.wind);

            // 🌟 可选：闪烁效果（偶尔加亮）
            if (Math.random() < 0.02) {
              this.particles[i].alpha = Math.min(
                1,
                this.particles[i].alpha + 0.3
              );
            }

            if (this.particles[i].alpha <= 0) {
              this.particles.splice(i, 1);
            }
          }

          return this.particles.length > 0;
        }
      }

      explode() {
        this.launchPhase = false;
        this.exploded = true;

        // 💥 More colorful explosion — each particle picks a hue from the palette
        for (let i = 0; i < 180; i++) {
          const hue =
            this.palette[Math.floor(Math.random() * this.palette.length)];
          const lightness = 45 + Math.random() * 30; // 45–75% brightness
          const color = `hsl(${hue}, 100%, ${lightness}%)`;

          const particle = new Particle(this.x, this.rocketY, color);
          const angle = (i / 180) * Math.PI * 2;
          const speed = Math.random() * 4 + 2;
          particle.velocity.x = Math.cos(angle) * speed;
          particle.velocity.y = Math.sin(angle) * speed;
          this.particles.push(particle);
        }
      }

      draw(ctx) {
        if (this.launchPhase) {
          // 绘制火箭轨迹
          ctx.beginPath();
          ctx.moveTo(this.x, this.rocketY + 30);
          ctx.lineTo(this.x, this.rocketY + 10);
          ctx.strokeStyle = `rgba(255, 165, 0, 0.8)`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // 绘制火箭头部
          ctx.beginPath();
          ctx.arc(this.x, this.rocketY, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#FFD700";
          ctx.fill();
        } else {
          this.particles.forEach((particle) => particle.draw(ctx));
        }
      }
    }

    // Animation loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      // Set canvas size to full screen
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // Create a new firework
      const newFirework = new CanvasFirework(targetX, targetY);
      fireworksRef.current.push(newFirework);

      const animate = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw all fireworks
        fireworksRef.current = fireworksRef.current.filter((firework) => {
          firework.update();
          firework.draw(ctx);
          return firework.update(); // Only keep active fireworks
        });

        // Continue animation if there are fireworks
        if (fireworksRef.current.length > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animate();

      // Clean up
      return () => {
        window.removeEventListener("resize", resizeCanvas);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [targetX, targetY]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      />
    );
  };

  return (
    <div>
      {/* Settings button (top-right) */}
      <button
        className="settings-top-btn"
        onClick={() => setSettingsOpen(true)}
      >
        Settings
      </button>

      {/* Section progress bar in top left */}
      <div className="section-progress-container">
        <div className="section-progress-bar">
          <div
            className="section-progress-fill"
            style={{
              width:
                contentSections.length > 0
                  ? ((currentIndex + 1) / contentSections.length) * 100 + "%"
                  : "0%",
            }}
          ></div>
        </div>
        <div className="section-progress-label">
          Word {contentSections.length > 0 ? currentIndex + 1 : 0} /{" "}
          {contentSections.length}
        </div>
      </div>
      <div className="container">
        {/* <h1>Word Display GUI - Display Area</h1>
        <div className="instructions">
          <p><strong>Instructions:</strong> Type the highlighted letter in the input box below. The content will update as you type.</p>
        </div> */}
        <div id="wordContainer" ref={wordContainerRef}>
          {/* Display fireworks */}
          {fireworks.map((firework) => (
            <Firework
              key={firework.id}
              targetX={firework.targetX}
              targetY={firework.targetY}
            />
          ))}

          {/* Display the current section, highlighting the current and correct letters */}
          {currentSection ? (
            <p>
              {currentSection.split("").map((char, idx) => {
                // Common style for both space and letter boxes
                const isCurrent = idx === currentLetterIndex;
                const isCorrect = idx < currentLetterIndex;
                const boxStyle = {
                  minWidth: effectiveFontSize * 0.65 + "px", // width similar to a letter
                  padding:
                    effectiveFontSize * 0.18 +
                    "px " +
                    effectiveFontSize * 0.22 +
                    "px",
                  margin: effectiveFontSize * 0.08 + "px",
                  borderRadius: effectiveFontSize * 0.25 + "px",
                  display: "inline-block",
                  backgroundColor: isCorrect
                    ? "#28a745"
                    : isCurrent
                    ? "#ff9800"
                    : "#181818",
                  color: "#ffffff",
                  fontSize: effectiveFontSize + "px",
                  fontFamily:
                    "Mulish, Courier New, monospace, Arial, sans-serif",
                  fontWeight: isCurrent ? "bold" : "normal",
                  textAlign: "center",
                  verticalAlign: "middle",
                  lineHeight: effectiveFontSize + "px",
                  boxSizing: "border-box",
                };
                return (
                  <span
                    key={idx}
                    ref={(el) => (letterRefs.current[idx] = el)}
                    className={
                      isCorrect ? "correct" : isCurrent ? "current" : ""
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
              {currentIndex + 1 < contentSections.length
                ? "Next Word"
                : "Finish"}
            </button>
          )}
        </div>
        <div className="fixed-action-container">
          <button className="quit-btn" onClick={goBack}>
            Quit
          </button>
          {/* <button className="stats-btn" onClick={() => navigate('/stats', { state: { perLetterStats } })}>Stats</button> */}
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3>Settings</h3>
            </div>
            <div style={{ marginTop: 12 }}>
              <label
                style={{ display: "block", color: "#fff", marginBottom: 6 }}
              >
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min={120}
                max={220}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ color: "#fff" }}>Lighting Mode:</label>
              <div>
                <label style={{ color: "#fff", marginRight: 8 }}>
                  <input
                    type="radio"
                    name="lightingModeModal"
                    checked={lightingMode === "individual"}
                    onChange={() => setLightingMode("individual")}
                  />{" "}
                  Individual
                </label>
                <label style={{ color: "#fff" }}>
                  <input
                    type="radio"
                    name="lightingModeModal"
                    checked={lightingMode === "region"}
                    onChange={() => setLightingMode("region")}
                  />{" "}
                  Region
                </label>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Display;
