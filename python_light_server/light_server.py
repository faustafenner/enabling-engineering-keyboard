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

lighting = SteelSeriesLighting(game="MYAPP")
try:
    lighting.remove_game() 
except Exception:
    pass
lighting.register_game("Python Test", "Me", deinitialize_timer_length_ms=60000)  # 60秒先验证



# Pre-bind all letter keys (A-Z) with unique event names to avoid flashing on first use
# This ensures each letter key is ready to light instantly when requested
for letter in string.ascii_lowercase:
    event = f"{letter.upper()}KEY_EVENT"  # Unique event name for each letter
    try:
        lighting.register_event(event)  # Register the event with SteelSeries GG
        lighting.bind_key_color(event, letter, "#000000")  # Bind the key to the event with black (off) as default
    except Exception as e:
        print(f"Failed to pre-bind {letter}: {e}")

# Add a startup initializer to ensure all lights are off when the server starts
def initialize_lighting():
    try:
        lighting.lights_off()
        print("Initialized lighting: all keys turned off.")
    except Exception as e:
        print(f"Failed to initialize lighting during startup: {e}")

# Endpoint to light a single letter key
@app.route("/lights_on_key", methods=["POST"])
def lights_on_key():
    data = request.get_json()
    key = data.get("key")  # The letter to light
    color = data.get("color", "#ffffff")  # Color to use (default white)
    # If duration is omitted, treat as "no timeout" (leave lit until explicitly turned off)
    duration = data.get("duration")  # None if not provided
    if duration is not None:
        try:
            duration = float(duration)
        except Exception:
            duration = None

    # Only allow single letter keys (A-Z)
    if key and len(key) == 1 and key.isalpha():
        event = f"{key.upper()}KEY_EVENT"  # Use the unique event for this letter
        try:
            if duration is None:
                lighting.lights_on_key(event, key, color)  # no timeout, stay lit until lights_off
            else:
                lighting.lights_on_key(event, key, color, duration=duration)
            return jsonify({"status": f"Key '{key}' lit using lights_on_key()"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "No valid letter key provided"}), 400

# Endpoint to light a specific key region
@app.route("/lights_on_region", methods=["POST"])
def lights_on_region():
    data = request.json
    event = data.get("event", "REGION_EVENT")
    key = data.get("key")
    color = data.get("color", "#FFFFFF")
    # If duration omitted, treat as no timeout
    duration = data.get("duration")
    if duration is not None:
        try:
            duration = float(duration)
        except Exception:
            duration = None

    if not key:
        return jsonify({"error": "Missing key"}), 400

    try:
        if duration is None:
            lighting.lights_on_region(event, key, color)
        else:
            lighting.lights_on_region(event, key, color, duration=duration)
        return jsonify({"status": f"Region for key {key} lights on with {color}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to turn off a specific key
@app.route("/lights_off_key", methods=["POST"])
def lights_off_key():
    data = request.get_json()
    key = data.get("key")  # The letter/key to turn off
    
    if not key:
        return jsonify({"error": "No key provided"}), 400
    
    try:
        # Determine the key name for the event
        if key == " ":
            key_name = "space"
            key_display = "space"
        elif len(key) == 1 and key.isalpha():
            key_name = key.lower()
            key_display = key
        else:
            # Handle special keys like function keys
            key_name = key.lower().replace(" ", "_")
            key_display = key
        
        event = f"{key_name.upper()}KEY_EVENT"
        
        # Stop the refresher thread for this specific key's event
        lighting._stop_event_refresher(event)
        
        # Light the key with black color (off) for just a moment
        try:
            # Use the event to set the key to black with no duration
            payload = {
                "game": lighting.game,
                "event": event,
                "data": {"value": 0}
            }
            lighting._post("game_event", payload)
        except:
            pass  # If posting fails, the refresher stop should still work
        
        return jsonify({"status": f"Key '{key_display}' turned off"})
    except Exception as e:
        print(f"Error turning off key '{key}': {e}")
        return jsonify({"error": str(e)}), 500

# Endpoint to turn off a specific key region based on the key
@app.route("/lights_off_region_for_key", methods=["POST"])
def lights_off_region_for_key():
    """Turn off a region based on the key provided"""
    data = request.get_json()
    key = data.get("key")  # The letter/key to determine region
    
    if not key:
        return jsonify({"error": "No key provided"}), 400
    
    try:
        key_lower = key.lower() if key != " " else key  # Normalize to lowercase
        region_name = get_region_for_key(key_lower)
        if not region_name:
            return jsonify({"error": f"Key '{key_lower}' not in any region"}), 400
        
        # Turn off each key in the region immediately
        region_keys = KEYBOARD_REGIONS[region_name]
        
        for region_key in region_keys:
            event = f"{region_key.upper()}KEY_EVENT"
            try:
                # Stop the refresher thread for this key
                lighting._stop_event_refresher(event)
                # Post game event to turn off
                payload = {
                    "game": lighting.game,
                    "event": event,
                    "data": {"value": 0}
                }
                lighting._post("game_event", payload)
            except Exception as e:
                print(f"Failed to turn off key '{region_key}' in region: {e}")
        
        return jsonify({"status": f"Region {region_name} turned off for key '{key_lower}'"})
    except Exception as e:
        print(f"Error turning off region for key '{key}': {e}")
        return jsonify({"error": str(e)}), 500

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
    initialize_lighting()
    app.run(port=5050)