<template>
  <div h1>Word Display GUI - Input Area</div>
  <div class="navbar">
    <button class="nav-btn" onclick="window.location.href='index.html'">
      Input Area
    </button>
    <button class="nav-btn" onclick="window.location.href='display.html'">
      Display Area
    </button>
  </div>

  <div class="container">
    <h1>Word Display GUI - Input Area</h1>

    <div class="instructions">
      <p>
        <strong>Instructions:</strong> Enter content in the input area below.
        Each line should be a separate paragraph. Click "Create List" to
        generate the content sections.
      </p>
      <p>
        <strong>Note:</strong> Long content will be split into sections of
        approximately 100 letters without breaking words.
      </p>
    </div>

    <textarea
      v-model="wordInput"
      placeholder="Enter content, each line as a new paragraph&#10;Example:&#10;The quick brown fox jumps over the lazy dog.&#10;Easy does it."
    ></textarea>

    <div class="button-group">
      <button @click="createWordList">Create List</button>
      <button class="clear-btn" onclick="clearWords()">Clear All</button>
    </div>

    <button id="nextBtn" class="next-btn" onclick="handleNextButton()" disabled>
      Next Section
    </button>
    <button
      id="fullscreenBtn"
      class="fullscreen-btn"
      onclick="enterFullscreenMode()"
      disabled
    >
      Enter Full Screen
    </button>

    <div class="input-container">
      <label for="letterInput">Type the next letter:</label>
      <input
        type="text"
        id="letterInput"
        maxlength="1"
        placeholder="Type one letter"
        disabled
      />
    </div>

    <div class="progress-bar">
      <div class="progress-fill" id="progressFill"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const wordInput = ref("");

let contentSections = [];
let currentIndex = 0;
let currentSection = "";
let currentLetterIndex = 0;
let sectionCompleted = false;
let isFullscreenMode = false;

function createWordList() {
  // Get the input text
  const inputText = document.getElementById("wordInput").value;

  // Split the text into paragraphs (by new lines)
  const paragraphs = inputText
    .split("\n")
    .filter((paragraph) => paragraph.trim() !== "");

  // Process paragraphs to create sections of ~100 letters without splitting words
  contentSections = [];
  paragraphs.forEach((paragraph) => {
    // If paragraph is short enough, use it as is
    if (paragraph.length <= 100) {
      contentSections.push(paragraph);
    } else {
      // Split long paragraphs into sections without breaking words
      const words = paragraph.split(" ");
      let currentSection = "";

      for (const word of words) {
        // Check if adding this word would exceed 100 characters
        const testSection =
          currentSection === "" ? word : currentSection + " " + word;

        if (testSection.length <= 100) {
          currentSection = testSection;
        } else {
          // If currentSection has content, save it
          if (currentSection !== "") {
            contentSections.push(currentSection);
          }

          // If the word itself is longer than 100 chars, we have to split it
          if (word.length > 100) {
            // For very long words, we split them into chunks of 100
            for (let i = 0; i < word.length; i += 100) {
              contentSections.push(word.substring(i, i + 100));
            }
            currentSection = "";
          } else {
            // Start a new section with this word
            currentSection = word;
          }
        }
      }

      // Don't forget the last section
      if (currentSection !== "") {
        contentSections.push(currentSection);
      }
    }
  });

  // Reset index and displayed content
  currentIndex = 0;
  currentSection = "";
  currentLetterIndex = 0;
  sectionCompleted = false;

  // Enable next button if we have content
  const nextBtn = document.getElementById("nextBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  if (contentSections.length > 0) {
    nextBtn.disabled = false;
    fullscreenBtn.disabled = false;
    document.getElementById("letterInput").disabled = true;
  } else {
    nextBtn.disabled = true;
    fullscreenBtn.disabled = true;
  }

  // Save content to localStorage so it can be accessed by display page
  localStorage.setItem("contentSections", JSON.stringify(contentSections));
  localStorage.setItem("currentIndex", currentIndex);
  localStorage.setItem("currentSection", currentSection);
  localStorage.setItem("currentLetterIndex", currentLetterIndex);
  localStorage.setItem("sectionCompleted", sectionCompleted);
}

function handleNextButton() {
  // Save current state to localStorage
  localStorage.setItem("currentIndex", currentIndex);
  localStorage.setItem("currentSection", currentSection);
  localStorage.setItem("currentLetterIndex", currentLetterIndex);
  localStorage.setItem("sectionCompleted", sectionCompleted);

  // Redirect to display page
  window.location.href = "display.html";
}

function clearWords() {
  // Clear the input area
  document.getElementById("wordInput").value = "";

  // Reset variables
  contentSections = [];
  currentIndex = 0;
  currentSection = "";
  currentLetterIndex = 0;
  sectionCompleted = false;
  isFullscreenMode = false;

  // Reset button text
  document.getElementById("nextBtn").textContent = "Next Section";

  // Disable buttons
  document.getElementById("nextBtn").disabled = true;
  document.getElementById("letterInput").disabled = true;
  document.getElementById("fullscreenBtn").disabled = true;

  // Reset progress bar
  updateProgressBar();

  // Exit fullscreen mode if active
  exitFullscreenMode();

  // Clear localStorage
  localStorage.removeItem("contentSections");
  localStorage.removeItem("currentIndex");
  localStorage.removeItem("currentSection");
  localStorage.removeItem("currentLetterIndex");
  localStorage.removeItem("sectionCompleted");
}

function updateProgressBar() {
  const progressFill = document.getElementById("progressFill");
  if (currentSection.length > 0) {
    const progress = (currentLetterIndex / currentSection.length) * 100;
    progressFill.style.width = `${progress}%`;
  } else {
    progressFill.style.width = "0%";
  }
}

// Fullscreen mode functions
function enterFullscreenMode() {
  isFullscreenMode = true;
  document.body.classList.add("fullscreen-mode");

  // Create exit button
  const exitBtn = document.createElement("button");
  exitBtn.id = "exitFullscreenBtn";
  exitBtn.className = "exit-fullscreen-btn";
  exitBtn.textContent = "Exit Full Screen";
  exitBtn.onclick = exitFullscreenMode;
  document.body.appendChild(exitBtn);
}

function exitFullscreenMode() {
  isFullscreenMode = false;
  document.body.classList.remove("fullscreen-mode");

  // Remove exit button if it exists
  const exitBtn = document.getElementById("exitFullscreenBtn");
  if (exitBtn) {
    exitBtn.remove();
  }
}

function updateFullscreenDisplay() {
  // In this implementation, we don't need to duplicate content
  // The CSS handles the fullscreen display properly
}
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.navbar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.nav-btn {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.nav-btn:hover {
  background-color: #0069d9;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  margin-top: 80px;
}

h1 {
  color: #333;
  text-align: center;
  margin-top: 0;
}

h2 {
  color: #555;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

textarea {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-size: 16px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  width: 100%;
}

button:hover {
  background-color: #45a049;
}

.clear-btn {
  background-color: #f44336;
}

.clear-btn:hover {
  background-color: #d32f2f;
}

.next-btn {
  background-color: #007bff;
}

.next-btn:hover {
  background-color: #0069d9;
}

.next-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.fullscreen-btn {
  background-color: #ff9800;
}

.fullscreen-btn:hover {
  background-color: #e68900;
}

.exit-fullscreen-btn {
  background-color: #f44336;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  width: auto;
  padding: 10px 15px;
}

.exit-fullscreen-btn:hover {
  background-color: #d32f2f;
}

.instructions {
  background-color: #e3f2fd;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  flex: 1;
}

.input-container {
  margin-top: 15px;
}

#letterInput {
  width: 100%;
  padding: 12px;
  font-size: 20px;
  text-align: center;
  border: 2px solid #007bff;
  border-radius: 4px;
}

.progress-bar {
  height: 12px;
  background-color: #e9ecef;
  border-radius: 6px;
  margin: 15px 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #007bff;
  width: 0%;
  transition: width 0.3s ease;
}

.word-title {
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 28px;
  color: #007bff;
  text-align: center;
}

.congrats-message {
  font-size: 22px;
  color: #28a745;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  padding: 15px;
  background-color: #d4edda;
  border-radius: 8px;
  border: 1px solid #28a745;
}

.all-done-message {
  font-size: 24px;
  color: #007bff;
  font-weight: bold;
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background-color: #e3f2fd;
  border-radius: 8px;
  border: 1px solid #007bff;
}

.section-indicator {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-top: 10px;
  font-style: italic;
}

.paragraph-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fafafa;
}

.content-display {
  font-size: 36px;
  font-family: "Courier New", monospace;
  line-height: 1.5;
  text-align: center;
  margin: 20px 0;
}

.current {
  color: #007bff;
  text-decoration: underline;
}

.correct {
  color: #28a745;
}

.incorrect {
  color: #dc3545;
}

.typing-instruction {
  font-size: 18px;
  color: #555;
  margin: 15px 0;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 4px;
  text-align: center;
}
</style>
