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

    ALL_OFF_EVENT = "__ALL_OFF__"

    def __init__(self, game="MYAPP", core_props_path=None, retry_interval=5):
            """
            初始化 SteelSeries Lighting 控制器

            :param game: 游戏/应用标识符（字符串，必须唯一，例如 "MYAPP"）
            :param core_props_path: coreProps.json 的路径（优先使用此值；若为空将自动探测）
            :param retry_interval: SteelSeries GG 未启动时的重试间隔（秒）
            """
            # 1) 优先顺序：显式参数 > 环境变量 > 常见系统路径（GG/Engine 新旧版本）
            candidates = [
                core_props_path,
                os.getenv("STEELSERIES_COREPROPS"),
                r"C:\ProgramData\SteelSeries\SteelSeries Engine 3\coreProps.json",  # Windows (Engine 3)
                r"C:\ProgramData\SteelSeries\SteelSeries GG\coreProps.json",       # Windows (GG)
                "/Library/Application Support/SteelSeries Engine 3/coreProps.json", # macOS (Engine 3)
                "/Library/Application Support/SteelSeries GG/coreProps.json",       # macOS (GG)
                os.path.expanduser("~/.local/share/SteelSeries Engine 3/coreProps.json"),  # Linux (旧)
                os.path.expanduser("~/.local/share/SteelSeries GG/coreProps.json"),        # Linux (GG)
            ]

            core_props_resolved = next((p for p in candidates if p and os.path.exists(p)), None)
            if not core_props_resolved:
                raise FileNotFoundError(
                    "coreProps.json not found. Ensure SteelSeries GG (Engine) is running.\n"
                    "Tip: set env STEELSERIES_COREPROPS to the file path, or pass core_props_path explicitly."
                )

            # 2) 读取 API 地址与端口
            with open(core_props_resolved, "r", encoding="utf-8") as f:
                core_props = json.load(f)

            address = core_props.get("address")
            if not address:
                raise ValueError(f"Could not find 'address' in coreProps.json at {core_props_resolved}")

            self.game = game
            self.base_url = f"http://{address}"

            # 3) 自检：等待 SteelSeries GG Engine 启动
            while not self._health_check():
                print(f"[WARN] SteelSeries GG not available at {self.base_url}, retrying in {retry_interval}s...")
                time.sleep(retry_interval)

            print(f"[INFO] Connected to SteelSeries GG at {self.base_url} (coreProps: {core_props_resolved})")
            self._bound_events = set()   # 事件/按键 绑定缓存
            self._ensure_all_off_event()


    def _post(self, endpoint, payload):
        """
        发送 POST 请求到 SteelSeries GG API（增强版）
        —— 自动转 JSON，若 GG 返回错误则打印详细信息
        """
        url = f"{self.base_url}/{str(endpoint).lstrip('/')}"
        try:
            r = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
            r.raise_for_status()
        except requests.HTTPError as e:
            # 打印返回体，帮助调试 400 错误（如字段无效、值过大、重复注册）
            print(f"[HTTP {r.status_code}] POST {url}")
            print(f"Request payload: {json.dumps(payload, indent=2)}")
            print(f"Response text: {r.text}")
            raise
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

    def register_game(self, display_name="My Python App", developer="Me",deinitialize_timer_length_ms: int | None = None):
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
        if deinitialize_timer_length_ms is not None:
            payload["deinitialize_timer_length_ms"] = int(deinitialize_timer_length_ms)
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
        熄灭所有键（无闪烁版）：只触发已预绑定的全黑事件
        """
        # 确保已完成一次性预绑定（容错）
        self._ensure_all_off_event()
        # 仅触发事件，不再重新 bind
        self._post("game_event", {"game": self.game, "event": self.ALL_OFF_EVENT, "data": {"value": 1}})
        print("[INFO] All keys lights off (no-flash)")

    
    def remove_game(self):
        return self._post("remove_game", {"game": self.game})
    
    def _ensure_all_off_event(self):
        """只在第一次把 ALL_OFF_EVENT 绑定到全键黑色，后续仅触发 event 即可"""
        if self.ALL_OFF_EVENT in self._bound_events:
            return
        # 注册事件
        self.register_event(self.ALL_OFF_EVENT)
        # 绑定全键黑色
        payload = {
            "game": self.game,
            "event": self.ALL_OFF_EVENT,
            "handlers": [{
                "device-type": "keyboard",
                "zone": "all",
                "mode": "color",
                "color": {"red": 0, "green": 0, "blue": 0}
            }]
        }
        self._post("bind_game_event", payload)
        self._bound_events.add(self.ALL_OFF_EVENT)



