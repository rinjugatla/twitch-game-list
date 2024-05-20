import { URLSearchParams } from "url";
import { IgdbGames, TwitchTokenAPIResponse, TwtichGames } from "./types/Twtich";

export class TwitchApiSetting {
	private _ClientId: string;
	private _ClientSecret: string;

	/**
	 *
	 * @param id クライアントID
	 * @param secret 秘密鍵
	 */
	constructor(id: string, secret: string) {
		this._ClientId = id;
		this._ClientSecret = secret;
	}

	get ClientId(): string {
		return this._ClientId;
	}

	get ClientSecret(): string {
		return this._ClientSecret;
	}
}

class TwitchToken {
	private _AccessToken: string;
	private _ExpiresIn: number;
	private _TokenType: string;

	/**
	 *
	 * @param token トークン
	 * @param expires 期限
	 * @param tokenType トークンタイプ
	 */
	constructor(data: TwitchTokenAPIResponse) {
		this._AccessToken = data.access_token;
		this._ExpiresIn = data.expires_in;
		this._TokenType = data.token_type;
	}

	/**
	 * トークンが期限切れか
	 * @param prevGetTokenTime 前回のトークン取得時間
	 */
	isExpired(prevGetTokenTime: number): boolean {
		const notInit = prevGetTokenTime == 0;
		if (notInit) {
			return true;
		}

		const expired = Date.now() - prevGetTokenTime > this._ExpiresIn;
		return expired;
	}

	get token(): string {
		const param = `Bearer ${this._AccessToken}`;
		return param;
	}   
}

export class TwitchApi {
	_Setting: TwitchApiSetting;
	_Token: TwitchToken | null;
	_PrevGetTokenTime: number;

	constructor(setting: TwitchApiSetting) {
		this._Setting = setting;
		this._Token = null;
		this._PrevGetTokenTime = 0;
	}

	async refreshToken() {
		const needRefresh = this._Token == null || this._Token.isExpired(this._PrevGetTokenTime);
		if (!needRefresh) { return; }

		const url = "https://id.twitch.tv/oauth2/token";
		const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: this._Setting.ClientId,
                client_secret: this._Setting.ClientSecret,
                grant_type: "client_credentials"
            })
		});
        const data = await response.json();
		this._Token = new TwitchToken(data);
		this._PrevGetTokenTime = Date.now();
		console.log("refreshed token.");
	}

	/**
	 * IGDBからゲーム情報を取得
	 * 
	 * https://api-docs.igdb.com/?java#game
	 * 
	 * @param query
	 */
	async getIgdbGames(query: string) {
		await this.refreshToken();

		const url = "https://api.igdb.com/v4/games";

		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: this._Token!.token,
				"Client-Id": this._Setting.ClientId
			},
			body: query
		});

		const json = await response.json();
		const data = json as IgdbGames;
		return data;
	}

    /**
     * Game情報を取得
     * @param startId 
     * @param offset 
     * @returns 
     */
    async getGames(startId: number, offset: number): Promise<TwtichGames> {
        await this.refreshToken();

        const baseUrl = "https://api.twitch.tv/helix/games";
        const idRange = this.range(startId, startId + this.getGameCount(), 1);
        const params = this.createParams("igdb_id", idRange.map(id => id.toString()));
        const url = `${baseUrl}?${params}`;

        const response = await fetch(url, {
            method: "GET",
			headers: {
				Authorization: this._Token!.token,
				"Client-Id": this._Setting.ClientId
			},
		});
		const json = await response.json();
		return json.data;
    }

	/**
	 * Games APIで取得するゲーム数
	 * @returns 
	 */
	getGameCount(){
		return 99;
	}

    /**
     * 連番の配列を作成
     * 
     * 0, 4, 1の場合、0, 1, 2, 3, 4を生成
     * 
     * @param start 開始
     * @param stop 終了
     * @param step ステップ
     * @returns 
     */
    private range(start: number, stop: number, step: number){
        const result = Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
        return result;
    }

    /**
	 * 同じkeyのパラメータを作成
	 * @param key パラメータキー
	 * @param values 値
	 */
	private createParams(key: string, values: string[]): URLSearchParams {
		const params = new URLSearchParams();
		for (const value of values) {
			params.append(key, value);
		}
		return params;
	}
}