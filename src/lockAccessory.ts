import { Service, PlatformAccessory, Logger } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';
import { LockStatus } from './yaleApi';

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
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.UUID);

    this.service = this.accessory.getService(this.platform.Service.LockMechanism) || this.accessory.addService(this.platform.Service.LockMechanism);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.handleLockCurrentStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onGet(this.handleLockTargetStateGet.bind(this))
      .onSet(this.handleLockTargetStateSet.bind(this));

  }

  /**
   * Handle requests to get the current value of the "Lock Current State" characteristic
   */
  async handleLockCurrentStateGet() {
    this.log.debug('Triggered GET LockCurrentState');

    // set this to a valid value for LockCurrentState
    const status = await this.platform.yaleApi.getLockStatus(this.accessory.UUID);
    switch(status) {
      case LockStatus.locked:
        return this.platform.Characteristic.LockCurrentState.SECURED;
      case LockStatus.unlocked:
        this.platform.Characteristic.LockCurrentState.UNSECURED;
    }
    const currentValue = this.platform.Characteristic.LockCurrentState.UNSECURED;
    this.platform.yaleApi.getLockStatus(this.accessory.UUID);

    return currentValue;
  }


  /**
   * Handle requests to get the current value of the "Lock Target State" characteristic
   */
  handleLockTargetStateGet() {
    this.log.debug('Triggered GET LockTargetState');

    // set this to a valid value for LockTargetState
    const currentValue = this.platform.Characteristic.LockTargetState.UNSECURED;

    return currentValue;
  }

  /**
   * Handle requests to set the "Lock Target State" characteristic
   */
  handleLockTargetStateSet(value) {
    this.log.info('Triggered SET LockTargetState:' + value);
  }
}