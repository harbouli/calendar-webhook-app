import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), 'tokens.json');

export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export interface WatchChannelInfo {
  channelId: string;
  resourceId: string;
  expiration: number;
}

export interface StorageData {
  tokens?: StoredTokens;
  watchChannel?: WatchChannelInfo;
}

export class TokenStorage {
  private data: StorageData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        const fileContent = fs.readFileSync(TOKEN_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
    return {};
  }

  private saveData(): void {
    try {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  getTokens(): StoredTokens | null {
    return this.data.tokens || null;
  }

  saveTokens(tokens: StoredTokens): void {
    this.data.tokens = tokens;
    this.saveData();
  }

  getWatchChannel(): WatchChannelInfo | null {
    return this.data.watchChannel || null;
  }

  saveWatchChannel(channel: WatchChannelInfo): void {
    this.data.watchChannel = channel;
    this.saveData();
  }

  clearWatchChannel(): void {
    delete this.data.watchChannel;
    this.saveData();
  }

  isAuthenticated(): boolean {
    return !!this.data.tokens?.access_token;
  }
}
