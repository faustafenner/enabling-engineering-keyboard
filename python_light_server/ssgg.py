import json
import os
import time
import requests


class SteelSeriesLighting:
    
    REGIONS = {
        "region1": list("qweasdzxc"),
        "region2": list("rtyfghvbn"),
        "region3": list("ujmikolp")
    }

    def __init__(self, game="MYAPP", core_props_path=None, retry_interval=5):
        """
        初始化 SteelSeries Lighting 控制器

        :param game: 游戏/应用标识符（字符串，必须唯一，例如 "MYAPP"）
        :param core_props_path: coreProps.json 的路径（默认安装位置）
        :param retry_interval: SteelSeries GG 未启动时的重试间隔（秒）
        """
        # 默认路径：SteelSeries Engine 在 Windows 的安装目录
        if core_props_path is None:
            core_props_path = r'/Library/Application Support/SteelSeries Engine 3/coreProps.json'

        # 检查配置文件是否存在
        if not os.path.exists(core_props_path):
            raise FileNotFoundError(f"coreProps.json not found at {core_props_path}")

        # 从 coreProps.json 读取 API 地址和端口
        with open(core_props_path, "r") as f:
            core_props = json.load(f)

        address = core_props.get("address")
        if not address:
            raise ValueError("Could not find 'address' in coreProps.json")

        self.game = game
        self.base_url = f"http://{address}"

        # 自检：等待 SteelSeries GG Engine 启动
        while not self._health_check():
            print(f"[WARN] SteelSeries GG not available at {self.base_url}, retrying in {retry_interval}s...")
            time.sleep(retry_interval)

        print(f"[INFO] Connected to SteelSeries GG at {self.base_url}")
        self._bound_events = set()   # 事件/按键 绑定缓存

    def _post(self, endpoint, payload):
        """
        发送 POST 请求到 SteelSeries GG API

        :param endpoint: API 路径（例如 "game_metadata"）
        :param payload: 请求体（字典）
        :return: JSON 响应（如果有）
        """
        url = f"{self.base_url}/{endpoint}"
        headers = {"Content-Type": "application/json"}
        r = requests.post(url, headers=headers, data=json.dumps(payload))
        r.raise_for_status()
        return r.json() if r.text else {}

    def _health_check(self):
        """
        检测 SteelSeries GG API 是否可用
        方法：尝试发送一个临时的 game_metadata 请求
        返回 True 表示 GG 已启动并监听端口
        """
        try:
            payload = {
                "game": self.game,
                "game_display_name": "HealthCheck",
                "developer": "Checker",
                "deinitialize_timer_length_ms": 1000
            }
            r = requests.post(
                f"{self.base_url}/game_metadata",
                headers={"Content-Type": "application/json"},
                data=json.dumps(payload),
                timeout=1
            )
            return r.status_code in (200, 204)  # API 正常响应
        except requests.RequestException:
            return False

    def register_game(self, display_name="My Python App", developer="Me"):
        """
        注册应用（告诉 GG 有一个新应用接入）

        :param display_name: 在 GG UI 中显示的应用名
        :param developer: 开发者名称
        :return: API 响应
        """
        payload = {
            "game": self.game,
            "game_display_name": display_name,
            "developer": developer,
            "deinitialize_timer_length_ms": 10000
        }
        return self._post("game_metadata", payload)

    def register_event(self, event, min_value=0, max_value=1, icon_id=1):
        """
        注册一个事件（类似一个灯光开关）

        :param event: 事件名称（字符串）
        :param min_value: 最小值（通常为 0）
        :param max_value: 最大值（通常为 1）
        :param icon_id: GG 内置的图标 ID（用于 UI 显示）
        :return: API 响应
        """
        payload = {
            "game": self.game,
            "event": event,
            "min_value": min_value,
            "max_value": max_value,
            "icon_id": icon_id
        }
        return self._post("register_game_event", payload)

    def bind_key_color(self, event, key, hex_color):
        """
        绑定某个按键与颜色

        :param event: 事件名称
        :param key: 键位标识（例如 "q", "w", "a"）
        :param hex_color: 十六进制颜色 "#RRGGBB"
        :return: API 响应
        """
        # 转换 hex 颜色码为 RGB
        hex_color = hex_color.lstrip("#")
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

        payload = {
            "game": self.game,
            "event": event,
            "handlers": [
                {
                    "device-type": "keyboard",
                    "zone": key,
                    "mode": "color",
                    "color": {"red": r, "green": g, "blue": b}
                }
            ]
        }
        return self._post("bind_game_event", payload)

    def set_event_value(self, event, value=1):
        """
        触发事件，控制灯光开/关

        :param event: 事件名称
        :param value: 数值（1=开启，0=关闭）
        :return: API 响应
        """
        payload = {"game": self.game, "event": event, "data": {"value": value}}
        return self._post("game_event", payload)
    
    def ensure_key_bound(self, event, key, hex_color):
        """
        确保事件与按键绑定，仅在第一次使用时注册/绑定，避免闪烁

        :param event: 事件名称
        :param key: 键位标识
        :param hex_color: 十六进制颜色 "#RRGGBB"
        """
        if event not in self._bound_events:
            self.register_event(event)
            self.bind_key_color(event, key, hex_color)
            self._bound_events.add(event)

    def lights_on_key(self, event, key, hex_color="#FFFFFF", interval=1, duration=3600):
        """
        一键点亮并保持按键持续亮着（通过定时刷新）
        结束后自动关闭该键
        """
        self.ensure_key_bound(event, key, hex_color)
        # 循环刷新，保持亮灯
        start = time.time()
        while time.time() - start < duration:
            self.set_event_value(event, 1)
            print(f"[INFO] Key '{key.upper()}' refreshed, keeping light alive...")
            time.sleep(interval)
        print(f"[INFO] Key '{key.upper()}' lights_on finished after {duration} seconds")
        self.set_event_value(event, 0)   # 只关闭该键

    def lights_on_region(self, event, key, hex_color="#FFFFFF", interval=1, duration=3600):
        """
        区域点亮：输入区域内任意 key，点亮整个区域
        结束后自动执行 lights_off()
        """
        # 找到这个 key 属于哪个区域
        region = None
        for name, keys in self.REGIONS.items():
            if key in keys:
                region = keys
                break
        if not region:
            raise ValueError(f"Key '{key}' not in any region")

        self.register_event(event)

        # 转换 hex 颜色码为 RGB
        hex_color = hex_color.lstrip("#")
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

        # 一次性绑定整个区域
        handlers = []
        for k in region:
            handlers.append({
                "device-type": "keyboard",
                "zone": k,
                "mode": "color",
                "color": {"red": r, "green": g, "blue": b}
            })

        payload = {
            "game": self.game,
            "event": event,
            "handlers": handlers
        }
        self._post("bind_game_event", payload)

        # 循环保持点亮
        start = time.time()
        while time.time() - start < duration:
            self.set_event_value(event, 1)
            print(f"[INFO] Region ({''.join(region).upper()}) refreshed, keeping light alive...")
            time.sleep(interval)

        print(f"[INFO] Region ({''.join(region).upper()}) lights_on finished after {duration} seconds")
        self.lights_off()   # 自动熄灭



    def lights_off(self):
        """
        熄灭所有键（恢复黑色）
        """
        payload = {
            "game": self.game,
            "event": "CLEAR_ALL",
            "handlers": [
                {
                    "device-type": "keyboard",
                    "zone": "all",
                    "mode": "color",
                    "color": {"red": 0, "green": 0, "blue": 0}
                }
            ]
        }
        self._post("bind_game_event", payload)
        self._post("game_event", {"game": self.game, "event": "CLEAR_ALL", "data": {"value": 1}})
        print("[INFO] All keys lights off")

