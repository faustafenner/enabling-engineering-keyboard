import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Success.css"; 

function Success() {
  const navigate = useNavigate();

  // Turn off all LEDs when reaching success page
  useEffect(() => {
    fetch("http://localhost:5050/lights_off", { method: "POST" })
      .then(() => console.log("LEDs turned off on success page"))
      .catch(err => console.error("Error turning off LEDs:", err));
  }, []);

  return (
    <div className="success-container">
      <h1>All Done!</h1>
      <button className="success-btn" onClick={() => navigate("/")}>
        Return to Input Page
      </button>
    </div>
  );
}

export default Success;