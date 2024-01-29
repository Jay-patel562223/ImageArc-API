from PIL import Image
import sys
import os.path


def dpi_detect(image_source):
    check_file = os.path.isfile(image_source)
    if check_file:
        with Image.open(image_source) as img:
            width, height = img.size
            if 'dpi' in img.info:
                datadpi = img.info['dpi'][0]
                print([datadpi, width, height])
            else:
                x_dpi, y_dpi = 72, 72   # default DPI
                # example physical size of image in inches
                physical_width, physical_height = 8, 6
                x_size = width / x_dpi * physical_width
                y_size = height / y_dpi * physical_height
                x_dpi = width / x_size
                y_dpi = height / y_size
                print([x_dpi, width, height])
    else:
        print([0, 0, 0])


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
