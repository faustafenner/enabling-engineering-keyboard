from flask import Flask, request, jsonify
from flask_cors import CORS
from ssgg import SteelSeriesLighting
import threading
import time
import re
import subprocess
import os
import string

# Create Flask app instance
app = Flask(__name__)
# Enable CORS so frontend (React) can call backend
CORS(app)

# Initialize SteelSeriesLighting object for keyboard control
lighting = SteelSeriesLighting(game="MYAPP")
# Register the game with SteelSeries GG
lighting.register_game("Python Test", "Me")

# Pre-bind all letter keys (A-Z) with unique event names to avoid flashing on first use
# This ensures each letter key is ready to light instantly when requested
for letter in string.ascii_lowercase:
    event = f"{letter.upper()}KEY_EVENT"  # Unique event name for each letter
    try:
        lighting.register_event(event)  # Register the event with SteelSeries GG
        lighting.bind_key_color(event, letter, "#00FF00")  # Bind the key to the event with a default color
    except Exception as e:
        print(f"Failed to pre-bind {letter}: {e}")

# Endpoint to light a single letter key
@app.route("/lights_on_key", methods=["POST"])
def lights_on_key():
    data = request.get_json()
    key = data.get("key")  # The letter to light
    color = data.get("color", "#00FF00")  # Color to use (default green)
    duration = data.get("duration", 1)    # Duration in seconds

    # Only allow single letter keys (A-Z)
    if key and len(key) == 1 and key.isalpha():
        event = f"{key.upper()}KEY_EVENT"  # Use the unique event for this letter
        try:
            lighting.lights_on_key(event, key, color, duration=duration)  # Light the key
            return jsonify({"status": f"Key '{key}' lit using lights_on_key()"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "No valid letter key provided"}), 400

# Endpoint to turn off all keyboard lights
@app.route("/lights_off", methods=["POST"])
def lights_off():
    try:
        lighting.lights_off()
        return jsonify({"status": "All keys lights off"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to run the test.py script (for testing lighting logic)
@app.route("/run_test", methods=["POST"])
def run_test():
    try:
        test_path = os.path.join(os.path.dirname(__file__), "test.py")  # Absolute path to test.py
        result = subprocess.run([
            "python3", test_path
        ], capture_output=True, text=True, timeout=30)
        return jsonify({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Run the Flask app on port 5050
if __name__ == "__main__":
    app.run(port=5050)
