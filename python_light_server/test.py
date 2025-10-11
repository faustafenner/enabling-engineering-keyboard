from ssgg import SteelSeriesLighting


def main():
    # 初始化
    lighting = SteelSeriesLighting(game="MYAPP")
    lighting.register_game("Python Test", "Me")

    print(">>> 测试单键点亮 G 键 5 秒")
    lighting.lights_on_key("GKEY_EVENT", "g", "#00FF00", duration=5)

    print(">>> 测试区域点亮（区域1：qweasdzxc，输入 q）红色 5 秒")
    lighting.lights_on_region("REGION1_EVENT", "q", "#FF0000", duration=5)

    print(">>> 测试区域点亮（区域2：rtyfghvbn，输入 f）蓝色 5 秒")
    lighting.lights_on_region("REGION2_EVENT", "f", "#0000FF", duration=5)

    print(">>> 测试区域点亮（区域3：ujmikolp，输入 j）青色 5 秒")
    lighting.lights_on_region("REGION3_EVENT", "j", "#00FFFF", duration=5)

if __name__ == "__main__":
    main()
