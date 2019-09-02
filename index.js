// MQTT Door Accessory plugin for HomeBridge
//
// Remember to add accessory to config.json. Example:
// "accessories": [
// {
//        "accessory": "mqttdoor",
//        "name": "PUT THE NAME OF YOUR DOOR HERE",
//        "url": "PUT URL OF THE BROKER HERE",
//  "username": "PUT USERNAME OF THE BROKER HERE",
//        "password": "PUT PASSWORD OF THE BROKER HERE"
//  "caption": "PUT THE LABEL OF YOUR DOOR HERE",
//  "topics": {
// "statusGet": 	"PUT THE MQTT TOPIC FOR THE GETTING THE STATUS OF YOUR DOOR HERE",
// "statusSet": 	"PUT THE MQTT TOPIC FOR THE SETTING THE STATUS OF YOUR DOOR HERE"
//  },
//  "onValue": "OPTIONALLY PUT THE VALUE THAT MEANS ON HERE (DEFAULT true)",
//  "offValue": "OPTIONALLY PUT THE VALUE THAT MEANS OFF HERE (DEFAULT false)",
//  "statusCmd": "OPTIONALLY PUT THE STATUS COMMAND HERE",
//  "integerValue": "OPTIONALLY SET THIS TRUE TO USE 1/0 AS VALUES",
// }
// ],
//
// When you attempt to add a device, it will ask for a "PIN code".
// The default code for all HomeBridge accessories is 031-45-154.

'use strict';

var Service, Characteristic;

var exec = require('child_process').exec;

function MqttDoorAccessory(log, config) {
  this.log = log;
  this.name = config['name'];

  this.caption = config['caption'];
  this.simulateTimeOpening = config['simulateTimeOpening'] || 15;
  this.simulateTimeOpen = config['simulateTimeOpen'] || 30;
  this.simulateTimeClosing = config['simulateTimeClosing'] || 15;
  this.onValue = config['on'];
  this.offValue = config['off'];
  // if (config["integerValue"]) {
  //   this.onValue 	= "1";
  //   this.offValue 	= "0";
  // }
  this.statusCmd = config['statusCmd'];

  this.doorStatus = false;

  this.service = new Service.Door(this.name);

  this.service.getCharacteristic(Characteristic.TargetPosition)
  //service.getCharacteristic(Characteristic.TargetDoorState)
    .on('get', (callback) => {
      this.log(this.service.getCharacteristic(Characteristic.TargetPosition).value, "Ping");
      callback(null, this.service.getCharacteristic(Characteristic.TargetPosition).value);
      // var targetDoorState = this.service.getCharacteristic(
      //   Characteristic.TargetPosition).value;
      // if (targetDoorState === 100 &&
      //   ((new Date() - this.lastOpened) >= (this.closeAfter * 1000))) {
      //   this.log('Setting TargetDoorState -> CLOSED');
      //   callback(null, 0);
      // } else {
      //   callback(null, targetDoorState);
      // }
    }).on('set', (value, callback) => {
    if (value === 100) {
      this.lastOpened = new Date();
      switch (this.service.getCharacteristic(Characteristic.TargetPosition).value) {
        case 0:
          this.openGarageDoor(callback, this.onValue);
          break;
        default:
          callback();
      }
    } else {
      callback();
    }

    //this.lastOpened = new Date();


  });

  MqttDoorAccessory.prototype.getStatus = function (callback) {

    if (this.statusCmd !== undefined) {
      //this.client.publish(this.topicStatusSet, this.statusCmd, this.publish_options);
    }
    callback(null, this.doorStatus);
  };

  MqttDoorAccessory.prototype.setStatus = function (status, callback, context) {
    console.log(status);
    if (context !== 'fromSetValue') {
      this.doorStatus = status;
      //this.client.publish(this.topicStatusSet, status == 100 ? this.onValue : this.offValue, this.publish_options);
      exec(this.onValue);
    }
    callback();
  };

  MqttDoorAccessory.prototype.getServices = function () {
    return [this.service];
  };

  MqttDoorAccessory.prototype.simulateGarageDoorOpening = async function () {
    this.service.getCharacteristic(Characteristic.TargetPosition).setValue(50);
    //this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPENING);
    setTimeout(() => {
      //this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.OPEN);
      this.service.getCharacteristic(Characteristic.TargetPosition).
        setValue(100);
      setTimeout(() => {
        //this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSING);
        this.service.getCharacteristic(Characteristic.TargetPosition).
          setValue(30);
        this.service.getCharacteristic(Characteristic.TargetPosition).
          setValue(0);
        setTimeout(() => {
          //this.service.setCharacteristic(Characteristic.CurrentDoorState, Characteristic.CurrentDoorState.CLOSED);
          this.service.getCharacteristic(Characteristic.TargetPosition).
            setValue(0);
        }, this.simulateTimeClosing * 1000);
      }, this.simulateTimeOpen * 1000);
    }, this.simulateTimeOpening * 1000);
  };

  MqttDoorAccessory.prototype.openGarageDoor = function (callback, onCommand) {

    exec(onCommand);

    this.log('Opening the garage door for...');
    this.simulateGarageDoorOpening();
    callback();
  };
}
module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-home-door-opener',
    'ControlsDoorOpener', MqttDoorAccessory);
};
