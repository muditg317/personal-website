import os
os.chdir(r"C:\Users\mudit\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin")
import sys
sys.argv = [
    "dev_appserver.py",
    r"C:\Users\mudit\Main_Drive\_Personal-Projects\personal-website\app.yaml"
    # r"C:\Users\mudit\Desktop\Main_Drive\2019_0Summer\CSSIatGoogle\blogasaurus\app.yaml"
]
__file__ = "dev_appserver.py"
sys.path.append(r"C:\Users\mudit\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin")
execfile("dev_appserver.py")
