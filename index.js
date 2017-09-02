var fs = require('fs');
const miio = require('miio');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiPM2_5")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-mi-pm2_5', 'MiPM2_5', MiPM2_5);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function MiPM2_5(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;

    var that = this;
    this.device = new miio.Device({
        address: that.config.ip,
        token: that.config.token
    });
}

MiPM2_5.prototype = {
    identify: function(callback) {
        callback();
    },

    getServices: function() {
        var that = this;
        var services = [];

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "PM2.5 Sensor")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        services.push(infoService);

        var batteryService = new Service.BatteryService();
        var batLowCharacteristic = batteryService.getCharacteristic(Characteristic.StatusLowBattery);
        var batLevelCharacteristic = batteryService.getCharacteristic(Characteristic.BatteryLevel);
        var batChargingStateCharacteristic = batteryService.getCharacteristic(Characteristic.ChargingState);
        services.push(batteryService);
        
        var pmService = new Service.AirQualitySensor(this.config['name']);
        var pm2_5Characteristic = pmService.addCharacteristic(Characteristic.PM2_5Density);
        pmService
            .getCharacteristic(Characteristic.AirQuality)
            .on('get', function(callback) {
                that.device.call("get_prop", ["aqi", "battery", "usb_state"]).then(result => {
                    that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - AirQuality - getState: " + result);
                    
                    batLevelCharacteristic.updateValue(result[1]);
                    batChargingStateCharacteristic.updateValue(result[2] === "on" ? 1: 0);
                    batLowCharacteristic.updateValue(result[1] < 20 ? 1: 0);
                    
                    pm2_5Characteristic.updateValue(result[0]);
                    
                    if(result[0] <= 50) {
                        callback(null, 1);
                    } else if(result[0] > 50 && result[0] <= 100) {
                        callback(null, 2);
                    } else if(result[0] > 100 && result[0] <= 200) {
                        callback(null, 3);
                    } else if(result[0] > 200 && result[0] <= 300) {
                        callback(null, 4);
                    } else if(result[0] > 300) {
                        callback(null, 5);
                    } else {
                        callback(true);
                    }
                    
                }).catch(function(err) {
                    that.log.error("[MiPM2_5][ERROR]AirQualitySensor - AirQuality - getState Error: " + err);
                    callback(true);
                });
            }.bind(this));
        services.push(pmService);
        
        if(!this.config['showTimeSwitchDisable']) {
            var switchService = new Service.Switch(this.config['showTimeSwitchName']);
            switchService
                .getCharacteristic(Characteristic.On)
                .on('get', function(callback) {
                    that.device.call("get_prop", ["time_state"]).then(result => {
                        that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - AirQuality - timeSwitchState: " + result);
                        callback(null, result[0] === 'on' ? 1 : 0);
                    }).catch(function(err) {
                        that.log.error("[MiPM2_5][ERROR]AirQualitySensor - AirQuality - timeSwitchState Error: " + err);
                        callback(true);
                    });
                }.bind(this))
                .on('set', function(value, callback) {
                    if(value) {
                        that.device.call("set_time_state", ['on']);
                    } else {
                        that.device.call("set_time_state", ['off']);
                    }
                    callback(null);
                }.bind(this));
            services.push(switchService);
        }

        return services;
    }

}

