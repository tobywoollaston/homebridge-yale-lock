import { Logger } from 'homebridge';
import fetch from 'node-fetch';

export class YaleAPI {

  private readonly authorizationToken = 'VnVWWDZYVjlXSUNzVHJhcUVpdVNCUHBwZ3ZPakxUeXNsRU1LUHBjdTpkd3RPbE15WEtENUJ5ZW1GWHV0am55eGhrc0U3V0ZFY2p0dFcyOXRaSWNuWHlSWHFsWVBEZ1BSZE1xczF4R3VwVTlxa1o4UE5ubGlQanY5Z2hBZFFtMHpsM0h4V3dlS0ZBcGZzakpMcW1GMm1HR1lXRlpad01MRkw3MGR0bmNndQ==';
  private readonly url = 'https://mob.yalehomesystem.co.uk/yapi';
  private _accessToken!: string;
  private _expiration!: Date;

  constructor(
        private readonly log: Logger,
        private readonly username: string,
        private readonly password: string,
  ) {
    this.getAccessToken();
  }

  public async getAccessToken() {
    const response = await fetch(this.url + '/o/token/', {
      method: 'POST',
      body: `grant_type=password&username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`,
      headers: {
        Authorization: `Basic ${this.authorizationToken}`,
        'Content-Type': 'application/x-www-form-urlencoded ; charset=utf-8',
      },
    });
    if (response.status === 200) {
      this.processAccessToken(response);
    } else {
      this.log.error('Unable to get authorisation token');
    }
  }

  private async processAccessToken(response) {
    const data = await response.json() as IOToken;
    this._accessToken = data.access_token as string;
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + data.expires_in);
    this._expiration = expiration;
    this.log.info('Got access token and expiration');
  }

  public async getLocks() {
    const response = await fetch(this.url + '/api/panel/device_status/', {
      headers: {
        Authorization: `Bearer ${this._accessToken}`,
      },
    });
    if (response.size === 200) {
      const data = await response.json();
      this.log.info('got devices');
      this.log.info(JSON.stringify(data, null, 2));
    } else {
      await this.getAccessToken();
      return await this.getLocks();
    }
  }
}

interface IOToken {
    access_token: string;
    expires_in: number;
}