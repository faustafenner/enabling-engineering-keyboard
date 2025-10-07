from flask import Flask, request, jsonify
from ssgg import SteelSeriesLighting

app = Flask(__name__)

# 初始化灯光控制
lighting = SteelSeriesLighting(game="MYAPP")
lighting.register_game("Python Test", "Me") 

@app.route("/lights_on_key", methods=["POST"])
def lights_on_key():
    data = request.json
    event = data.get("event", "KEY_EVENT")
    key = data.get("key")
    color = data.get("color", "#FFFFFF")
    duration = data.get("duration", 3600)
    interval = data.get("interval", 1)

    if not key:
        return jsonify({"error": "Missing key"}), 400

    lighting.lights_on_key(event, key, color, interval=interval, duration=duration)
    return jsonify({"status": f"Key {key} lights on with {color}"})


@app.route("/lights_on_region", methods=["POST"])
def lights_on_region():
    data = request.json
    event = data.get("event", "REGION_EVENT")
    key = data.get("key")
    color = data.get("color", "#FFFFFF")
    duration = data.get("duration", 3600)
    interval = data.get("interval", 1)

    if not key:
        return jsonify({"error": "Missing key"}), 400

    lighting.lights_on_region(event, key, color, interval=interval, duration=duration)
    return jsonify({"status": f"Region for key {key} lights on with {color}"})


@app.route("/lights_off", methods=["POST"])
def lights_off():
    lighting.lights_off()
    return jsonify({"status": "All keys lights off"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
