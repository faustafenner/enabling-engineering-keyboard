export default function SettingsModal({
  fontSize,
  setFontSize,
  lightingMode,
  setLightingMode,
  close,
}) {
  return (
    <div 
      className="modal-overlay" 
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1400,
      }}
    >
      <div 
        className="modal-panel" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#121212",
          padding: "20px",
          borderRadius: "10px",
          width: "380px",
          maxWidth: "calc(100% - 32px)",
          boxShadow: "0 6px 24px rgba(0, 0, 0, 0.6)",
        }}
      >
        <h3 style={{
          color: "#fff",
          margin: "0 0 16px 0"
        }}>Settings</h3>

        {/* FONT SIZE */}
        <label style={{
          display: "block",
          color: "#fff",
          marginBottom: "6px"
        }}>Font Size</label>
        <div className="settings-buttons" style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px"
        }}>
          {[120, 140, 160].map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={fontSize === size ? "active" : ""}
              style={{
                flex: 1,
                padding: "6px 0",
                backgroundColor: fontSize === size ? "#2196f3" : "#333",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {size === 120 ? "Small" : size === 140 ? "Medium" : "Large"}
            </button>
          ))}
        </div>

        {/* LIGHTING MODE */}
        <label style={{
          display: "block",
          color: "#fff",
          marginBottom: "6px"
        }}>Lighting Mode</label>
        <div style={{
          marginBottom: "16px"
        }}>
          <label style={{
            color: "#fff",
            marginRight: "16px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <input
              type="radio"
              checked={lightingMode === "individual"}
              onChange={() => setLightingMode("individual")}
              style={{
                cursor: "pointer"
              }}
            />
            Individual
          </label>
          <label style={{
            color: "#fff",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <input
              type="radio"
              checked={lightingMode === "region"}
              onChange={() => setLightingMode("region")}
              style={{
                cursor: "pointer"
              }}
            />
            Region
          </label>
        </div>

        <button 
          onClick={close}
          style={{
            padding: "8px 16px",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

