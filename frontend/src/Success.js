import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Display.css"; 

function Success() {
  const navigate = useNavigate();

  // Turn off all LEDs when reaching success page
  useEffect(() => {
    fetch("http://localhost:5050/lights_off", { method: "POST" })
      .then(() => console.log("LEDs turned off on success page"))
      .catch(err => console.error("Error turning off LEDs:", err));
  }, []);

  return (
    <div className="container" style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Success!</h1>
      <button className="next-section-btn" onClick={() => navigate("/")}>
        Return to Input Page
      </button>
    </div>
  );
}

export default Success;