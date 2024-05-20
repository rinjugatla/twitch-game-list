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

export type IgdbGames = IgdbGame[];

export type IgdbGame = {
    id?: number,
    age_rationgs?: number[],
    artworks?: number[],
    category?: number,
    created_at?: number,
    external_games?: number[],
    first_release_date?: number,
    genres?: number[],
    name?: string,
    parent_game?: number,
    platforms?: number[],
    release_dates?: number[],
    screenshots?: number[],
    similar_games?: number[]
    slug?: string,
    summary?: string,
    tags?: number[]
    themes?: number[],
    updated_at?: number[],
    url?: string,
    websites?: number[],
    checksum?: string,
    language_supports?: number[],
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