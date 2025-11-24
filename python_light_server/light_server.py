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

# Define keyboard regions for regional lighting
KEYBOARD_REGIONS = {
    "region1": list("qweasdzxc"),
    "region2": list("rtyfghvbn"),
    "region3": list("ujmikolp")
}

def get_region_for_key(key):
    """Returns the region name for a given key, or None if not found"""
    for region_name, keys in KEYBOARD_REGIONS.items():
        if key in keys:
            return region_name
    return None

# Pre-bind all letter keys (A-Z) with unique event names to avoid flashing on first use
# This ensures each letter key is ready to light instantly when requested
for letter in string.ascii_lowercase:
    event = f"{letter.upper()}KEY_EVENT"  # Unique event name for each letter
    try:
        lighting.register_event(event)  # Register the event with SteelSeries GG
        lighting.bind_key_color(event, letter, "#ffffff")  # Bind the key to the event with a default color
    except Exception as e:
        print(f"Failed to pre-bind {letter}: {e}")

# Register region events (but don't bind colors yet - will be done during priming)
for region_name in KEYBOARD_REGIONS.keys():
    event = f"{region_name.upper()}_REGION_EVENT"
    try:
        lighting.register_event(event)
    except Exception as e:
        print(f"Failed to register region event {region_name}: {e}")

# Add a startup initializer to ensure all lights are off when the server starts
def initialize_lighting():
    try:
        lighting.lights_off()
        print("Initialized lighting: all keys turned off.")
    except Exception as e:
        print(f"Failed to initialize lighting during startup: {e}")

# Track current colors to avoid unnecessary rebinding
key_colors = {}

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
            # Only rebind if color has changed
            key_upper = key.upper()
            if key_upper not in key_colors or key_colors[key_upper] != color:
                lighting.bind_key_color(event, key, color)
                key_colors[key_upper] = color
            
            # Stop any existing refresher
            lighting._stop_event_refresher(event)
            # Start new refresher
            if duration is None:
                lighting._start_event_refresher(event, interval=1, duration=None)
            else:
                lighting._start_event_refresher(event, interval=1, duration=duration)
            return jsonify({"status": f"Key '{key}' lit using lights_on_key()"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "No valid letter key provided"}), 400

# Endpoint to light a specific key region
@app.route("/lights_on_region", methods=["POST"])
def lights_on_region():
    data = request.json
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

    # Normalize key
    key_lower = key.lower() if key != " " else key
    
    # Find which region this key belongs to
    region_name = get_region_for_key(key_lower)
    if not region_name:
        return jsonify({"error": f"Key '{key}' not in any region"}), 400
    
    # Use single event per region (not per key)
    event = f"{region_name.upper()}_REGION_EVENT"
    region_keys = KEYBOARD_REGIONS[region_name]
    
    try:
        # Stop any existing refresher for this event
        lighting._stop_event_refresher(event)
        
        # Start the refresher
        if duration is None:
            lighting._start_event_refresher(event, interval=1, duration=None)
        else:
            lighting._start_event_refresher(event, interval=1, duration=duration)
            
        return jsonify({"status": f"Region {region_name} for key {key} lights on with {color}"})
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
        
        # Use single event per region (not per key)
        event = f"{region_name.upper()}_REGION_EVENT"
        
        # Stop the refresher thread for this event
        lighting._stop_event_refresher(event)
        
        # Turn off the region by posting value 0
        payload = {
            "game": lighting.game,
            "event": event,
            "data": {"value": 0}
        }
        lighting._post("game_event", payload)
        
        return jsonify({"status": f"Region {region_name} turned off for key '{key_lower}'"})
    except Exception as e:
        print(f"Error turning off region for key '{key}': {e}")
        return jsonify({"error": str(e)}), 500

# Endpoint to bind all regions with a specific color
@app.route("/bind_regions_color", methods=["POST"])
def bind_regions_color():
    data = request.json
    color = data.get("color", "#FFFFFF")
    
    try:
        hex_color = color.lstrip("#")
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        
        for region_name, region_keys in KEYBOARD_REGIONS.items():
            event = f"{region_name.upper()}_REGION_EVENT"
            handlers = []
            for k in region_keys:
                handlers.append({
                    "device-type": "keyboard",
                    "zone": k,
                    "mode": "color",
                    "color": {"red": r, "green": g, "blue": b}
                })
            payload = {
                "game": lighting.game,
                "event": event,
                "handlers": handlers
            }
            lighting._post("bind_game_event", payload)
        
        return jsonify({"status": f"All regions bound with color {color}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to turn off all keyboard lights
@app.route("/lights_off", methods=["POST"])
def lights_off():
    try:
        # Stop all refreshers and turn off individual keys
        for letter in string.ascii_lowercase:
            event = f"{letter.upper()}KEY_EVENT"
            try:
                lighting._stop_event_refresher(event)
                # Turn off the event
                payload = {
                    "game": lighting.game,
                    "event": event,
                    "data": {"value": 0}
                }
                lighting._post("game_event", payload)
            except Exception:
                pass
        
        # Stop all region refreshers and turn them off
        for region_name in KEYBOARD_REGIONS.keys():
            event = f"{region_name.upper()}_REGION_EVENT"
            try:
                lighting._stop_event_refresher(event)
                # Turn off the event
                payload = {
                    "game": lighting.game,
                    "event": event,
                    "data": {"value": 0}
                }
                lighting._post("game_event", payload)
            except Exception:
                pass
        
        # Also call the main lights_off for good measure
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