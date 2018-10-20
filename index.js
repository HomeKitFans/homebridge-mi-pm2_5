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
        
        var pmService = new Service.AirQualitySensor(this.config['name']);
        var pm2_5Characteristic = pmService.addCharacteristic(Characteristic.PM2_5Density);
        pmService
            .getCharacteristic(Characteristic.AirQuality)
            .on('get', function(callback) {
                that.device.call("get_prop", ["aqi"]).then(result => {
                    that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - AirQuality - getState: " + result);
                    
                    pm2_5Characteristic.updateValue(result[0]);
                    
                    if(result[0] <= 11) {
                        callback(null, Characteristic.AirQuality.EXCELLENT);
                    } else if(result[0] > 11 && result[0] <= 35) {
                        callback(null, Characteristic.AirQuality.GOOD);
                    } else if(result[0] > 35 && result[0] <= 55) {
                        callback(null, Characteristic.AirQuality.FAIR);
                    } else if(result[0] > 55 && result[0] <= 150) {
                        callback(null, Characteristic.AirQuality.INFERIOR);
                    } else if(result[0] > 150) {
                        callback(null, Characteristic.AirQuality.POOR);
                    } else {
                        callback(null, Characteristic.AirQuality.UNKNOWN);
                    }
                    
                }).catch(function(err) {
                    that.log.error("[MiPM2_5][ERROR]AirQualitySensor - AirQuality - getState Error: " + err);
                    callback(err);
                });
            }.bind(this));
        services.push(pmService);
        
        if(!this.config['showTimeSwitchDisable']) {
            var switchService = new Service.Switch(this.config['showTimeSwitchName']);
            switchService
                .getCharacteristic(Characteristic.On)
                .on('get', function(callback) {
                    that.device.call("get_prop", ["time_state"]).then(result => {
                        that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - Switch - getSwitchState: " + result);
                        callback(null, result[0] === 'on' ? true : false);
                    }).catch(function(err) {
                        that.log.error("[MiPM2_5][ERROR]AirQualitySensor - Switch - getSwitchState Error: " + err);
                        callback(err);
                    });
                }.bind(this))
                .on('set', function(value, callback) {
                    that.device.call("set_time_state", [value ? "on" : "off"]).then(result => {
                        that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - Switch - setSwitchState Result: " + result);
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
                    }).catch(function(err) {
                        that.log.error("[MiPM2_5][ERROR]AirQualitySensor - Switch - setSwitchState Error: " + err);
                        callback(err);
                    });
                }.bind(this));
            services.push(switchService);
        }

        var batteryService = new Service.BatteryService();
        var batLowCharacteristic = batteryService.getCharacteristic(Characteristic.StatusLowBattery);
        var batLevelCharacteristic = batteryService.getCharacteristic(Characteristic.BatteryLevel);
        batLevelCharacteristic
            .on('get', function(callback) {
                that.device.call("get_prop", ["battery"]).then(result => {
                    that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - Battery - getLevel: " + result);
                    batLowCharacteristic.updateValue(result[0] < 20 ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
                    callback(null, result[0]);
                }).catch(function(err) {
                    that.log.error("[MiPM2_5][ERROR]AirQualitySensor - Battery - getLevel Error: " + err);
                    callback(err);
                });
            }.bind(this));
        var batChargingStateCharacteristic = batteryService.getCharacteristic(Characteristic.ChargingState);
        batChargingStateCharacteristic
            .on('get', function(callback) {
                that.device.call("get_prop", ["usb_state"]).then(result => {
                    that.log.debug("[MiPM2_5][DEBUG]AirQualitySensor - Battery - getChargingState: " + result);
                    callback(null, result[0] === "on" ? Characteristic.ChargingState.CHARGING : Characteristic.ChargingState.NOT_CHARGING);
                }).catch(function(err) {
                    that.log.error("[MiPM2_5][ERROR]AirQualitySensor - Battery - getChargingState Error: " + err);
                    callback(err);
                });
            }.bind(this));
        services.push(batteryService);
    
        return services;
    }

}
