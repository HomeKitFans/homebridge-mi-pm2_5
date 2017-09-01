# homebridge-mi-pm2_5
[![npm version](https://badge.fury.io/js/homebridge-mi-pm2_5.svg)](https://badge.fury.io/js/homebridge-mi-pm2_5)

XiaoMi PM2.5 sensor plugin for HomeBridge.   
Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), all other developer and testers.   

![](https://raw.githubusercontent.com/YinHangCode/homebridge-mi-pm2_5/master/images/PM2_5.jpg)

## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g miio homebridge-mi-pm2_5
```

## Configuration
```
"accessories": [{
    "accessory": "MiPM2_5",
    "name": "AirQuality Sensor",
    "showTimeSwitch": false,
    "ip": "192.168.88.xx",
    "token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}]
```
## Get token
Open command prompt or terminal. Run following command:.
```
miio --discover
```
Wait until you get output similar to this:
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx is token.
## Version Logs
### 0.0.1
1.display XiaoMi PM2.5 sensor value.   
2.switch on/off XiaoMi PM2.5 sensor time display.   
