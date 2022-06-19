import { Service, PlatformAccessory, Logger } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';
import { LockStatus, RequestLockValue } from './yaleApi';

export class LockAccessory {
  private service: Service;

  private state = {
    LOCKED: 1,
    UNLOCKED: 2,
  };

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly log: Logger,
  ) {

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Yale')
      .setCharacteristic(this.platform.Characteristic.Model, 'ConexisL1')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.device_id);

    this.service = this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.handleLockTargetStateGet.bind(this))
      .onSet(this.handleLockTargetStateSet.bind(this));

  }

  private currentState = 1;

  /**
   * Handle requests to get the current value of the "Lock Current State" characteristic
   */
  async handleLockCurrentStateGet() {
    this.log.debug('Triggered GET LockCurrentState');

    // set this to a valid value for LockCurrentState
    const status = await this.platform.yaleApi.getLockStatus(this.accessory.context.device.device_id);
    this.log.info('lock current state: ' + status);
    let state;
    switch(status) {
      case LockStatus.locked:
        state = this.platform.Characteristic.LockCurrentState.SECURED;
        break;
      case LockStatus.unlocked:
        state = this.platform.Characteristic.LockCurrentState.UNSECURED;
        break;
    }
    this.currentState = state;
    return state;
  }


  /**
   * Handle requests to get the current value of the "Lock Target State" characteristic
   */
  handleLockTargetStateGet() {
    this.log.debug('Triggered GET LockTargetState');

    // set this to a valid value for LockTargetState
    if (this.changing) {
      switch(this.currentState) {
        case this.platform.Characteristic.LockCurrentState.SECURED:
          return this.platform.Characteristic.LockTargetState.UNSECURED;
        default:
          return this.platform.Characteristic.LockTargetState.SECURED;
      }
    } else {
      return this.currentState;
    }
  }

  private changing = false;

  /**
   * Handle requests to set the "Lock Target State" characteristic
   */
  async handleLockTargetStateSet(value) {
    this.log.info('Triggered SET LockTargetState:' + value);

    let requestValue;
    switch(value) {
      case this.platform.Characteristic.LockTargetState.SECURED:
        requestValue = RequestLockValue.locked;
        break;
      case this.platform.Characteristic.LockTargetState.UNSECURED:
        requestValue = RequestLockValue.unlocked;
        break;
    }
    await this.platform.yaleApi.updateLock(this.accessory.context.device, requestValue);
  }
}