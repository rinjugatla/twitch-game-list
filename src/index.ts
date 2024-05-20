import * as dotenv from 'dotenv';
import { TwitchApi, TwitchApiSetting } from './twitch';
import { TwtichGames } from './types/Twtich';
import { printLog } from './common';
import { load, save } from './gameInfo';
import { GameInfo } from './types/GameInfo';
dotenv.config();

const fetchIntervalMilliSec = 2000;

/**
 * Twitch APIラッパーを初期化
 * @returns 
 */
const initTwitchApi = async () => {
    const setting = new TwitchApiSetting(
        process.env.PRIVATE_CLIENT_ID as string, 
        process.env.PRIVATE_CLIENT_SECRET as string
    )
    const api = new TwitchApi(setting);
    await api.refreshToken();
    return api;
}

/**
 * 待機
 * @param milliSec 待機時間
 */
const sleep = (milliSec: number) => new Promise(resolve => setTimeout(resolve, milliSec))

/**
 * IGDBからゲームIDを取得
 * @param api Twitch API
 * @param prevData 前回取得したゲーム情報
 */
const fetchIgdbLastId = async (api: TwitchApi, prevData: GameInfo | null) => {
    const fetchGameLimit = 500;
    let lastId = prevData === null ? 1 : prevData.igdb_latest_id;
    for (let id = lastId; true; id+=fetchGameLimit) {
        try {
            printLog(`start fetch igdb games(id: ${id}...${id + fetchGameLimit})`);
            const query = `fields id; sort id; limit ${fetchGameLimit}; offset: ${id};`
            const games = await api.getIgdbGames(query);

            const fetchedLatestGame = games === null || games.length === 0;
            if(fetchedLatestGame) { break; }

            lastId = games[games.length - 1].id!;
            await sleep(fetchIntervalMilliSec);
        } catch (error) {
            console.error(error);
        }
    }

    return lastId;
}

/**
 * Twitchからゲーム情報を取得
 * @param api Twitch API
 * @param prevGames 前回の取得結果
 */
const fetchTwitchGames = async (api: TwitchApi, prevData: GameInfo | null, igdbLastId: number) => {
    let fetchedGames: TwtichGames = [];
    const prevLastId = prevData === null ? 1 : prevData.igdb_latest_id;
    for (let startId = prevLastId ; startId < igdbLastId; startId += api.getGameCount()) {
        try {
            printLog(`start fetch games(id: ${startId}...${startId + api.getGameCount()})`);
            const games = await api.getGames(startId);

            fetchedGames = [...fetchedGames, ...games];
            await sleep(fetchIntervalMilliSec);
        } catch (error) {
            console.error(error);
        }
    }

    return fetchedGames;
}

/**
 * ゲーム情報を更新
 */
const updateGames = async () => {
    const api = await initTwitchApi();
    const prevData = load();
    const igdbLastId = await fetchIgdbLastId(api, prevData)
    const currentGames = await fetchTwitchGames(api, prevData, igdbLastId);
    save(prevData, currentGames, igdbLastId);
}

await updateGames();