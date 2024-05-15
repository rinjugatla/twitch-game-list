/**
 * Twitchトークン
 */
export type TwitchTokenAPIResponse = {
    /**
     * 一時トークン
     */
	access_token: string;
    /**
     * 一時トークンの有効期限
     */
	expires_in: number;
    /**
     * 
     */
	token_type: string;
}

/**
 * Twitch Games API
 */
export type TwtichGamesAPIResponse = {
    data: TwtichGames
}

/**
 * Twitch Games
 */
export type TwtichGames = TwitchGame[]

/**
 * Twitch Game
 */
export type TwitchGame = {
    id: string,
    name: string,
    box_art_url: string,
    igdb_id: string
}