from PIL import Image
import sys
import json


def dpi_detect(image_source):
    with Image.open(image_source) as img:
        width, height = img.size
        # print(f"Image size: {width} x {height} pixels")
        if 'dpi' in img.info:
            # data = {}
            # data["width"] = width
            # data["height"] = height
            # data['dpi'] = img.info['dpi'][0]
            datadpi = img.info['dpi'][0]
            # data = {"width": width, "height": height}
            # data = datadpi
            print([datadpi, width, height])
            # json_data = json.dumps(data)
            # print(json_data)
            # print(json_data)
            # resp = json.loads(data)

            # # print(f"DPI: {img.info['dpi']}")
            # data = {width: width, height: height, dpi: img.info['dpi']}
            # # data = {"width": width, "height": height, "dpi": img.info['dpi']}
            # # json_data = json.dumps(data)
            # print(data)
            # # print(data)
        else:
            x_dpi, y_dpi = 72, 72   # default DPI
            # example physical size of image in inches
            physical_width, physical_height = 8, 6
            x_size = width / x_dpi * physical_width
            y_size = height / y_dpi * physical_height
            x_dpi = width / x_size
            y_dpi = height / y_size
            print('1')
            # print([x_dpi, width, height])
            # datadpi = img.info['dpi'][0]
            # print([datadpi, width, height])

            # data = {}
            # data['width'] = width
            # data['height'] = height
            # print(data)
            # resp = json.loads(data)
            # print(resp)

            # json_data = json.dumps(data)
            # print(json_data)
            # data = {width: width, height: height, dpi: img.info['dpi']}
            # json_data = json.dumps(data)
            # print(data)
            # print(f"Estimated DPI: {x_dpi:.2f} x {y_dpi:.2f}")
            # data = {"width": width, "height": height}
            # json_data = json.dumps(data)


if __name__ == "__main__":
    path_is = sys.argv[1]
    image_name = sys.argv[2]

    valid_images = ["jpg", "png", "tif"]
    ext_name = image_name.split(".")[-1]
    if ext_name.lower() not in valid_images:
        print("Please Enter Full Image Name")
        sys.exit(0)

    main_path = './'+path_is+'/'+image_name

    dpi_detect(main_path)
