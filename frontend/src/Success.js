import React from "react";
import { useNavigate } from "react-router-dom";
import "./Display.css"; 

function Success() {
  const navigate = useNavigate();
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