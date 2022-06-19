import { Logger } from 'homebridge';
import fetch from 'node-fetch';

export class YaleAPI {

  private readonly authorizationToken = 'VnVWWDZYVjlXSUNzVHJhcUVpdVNCUHBwZ3ZPakxUeXNsRU1LUHBjdTpkd3RPbE15WEtENUJ5ZW1GWHV0am55eGhrc0U3V0ZFY2p0dFcyOXRaSWNuWHlSWHFsWVBEZ1BSZE1xczF4R3VwVTlxa1o4UE5ubGlQanY5Z2hBZFFtMHpsM0h4V3dlS0ZBcGZzakpMcW1GMm1HR1lXRlpad01MRkw3MGR0bmNndQ==';
  private readonly url = 'https://mob.yalehomesystem.co.uk/yapi';

  constructor(
        private readonly log: Logger,
        private readonly username: string,
        private readonly password: string,
  ) {}

  public async getAccessToken() : Promise<string> {
    const response = await fetch(this.url + '/o/token/', {
      method: 'POST',
      body: `grant_type=password&username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`,
      headers: {
        Authorization: `Basic ${this.authorizationToken}`,
        'Content-Type': 'application/x-www-form-urlencoded ; charset=utf-8',
      },
    });
    if (response.status === 200) {
      return this.processAccessToken(response);
    } else {
      this.log.error('Unable to get authorisation token');
      throw new Error('Unauthorised');
    }
  }

  private async processAccessToken(response) : Promise<string> {
    const data = await response.json() as IOToken;
    this.log.info('Got access token');
    return data.access_token;
  }

  public async getLocks(): Promise<IDevice[]> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(this.url + '/api/panel/device_status/', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 200) {
      return this.findLocks(response);
    } else {
      throw new Error('Cannot get locks');
    }
  }

  private async findLocks(response): Promise<IDevice[]> {
    const data = await response.json() as IDevices;
    return data.data.filter(device => device.type === 'device_type.door_lock');
  }
}

interface IOToken {
    access_token: string;
    expires_in: number;
}

interface IDevices {
    result: boolean;
    message: string;
    data: [IDevice];
}

interface IDevice {
    area: string;
    no: string;
    address: string;
    type: string;
    name: string;
    status1: string;
    device_id: string;
}