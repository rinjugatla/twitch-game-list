import * as dotenv from 'dotenv';
import { TwitchApi, TwitchApiSetting } from './twitch';
import { TwtichGames } from './types/Twtich';
import { printLog } from './common';
import { load, save } from './gameInfo';
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
 * 
 * @param api Twitch API
 * @param prevIgdbLastId 前回のIGDB ID
 */
const fetchIgdbLastId = async (api: TwitchApi, prevIgdbLastId: number) => {
    const fetchGameLimit = 500;
    let lastId = prevIgdbLastId;
    for (let id = prevIgdbLastId; true; id+=fetchGameLimit) {
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
 * ゲーム情報を取得
 * @param api Twitch API
 * @param prevGames 前回の取得結果
 */
const fetchGames = async (api: TwitchApi, prevLastId: number, igdbLastId: number) => {
    let fetchedGames: TwtichGames = [];
    let offset = prevLastId;
    // データベースに登録されているゲームをすべて取得するため終了条件は未指定とする
    console.log(prevLastId, prevLastId < igdbLastId, prevLastId + api.getGameCount())
    for (let startId = prevLastId ; startId < igdbLastId; startId += api.getGameCount()) {
        try {
            printLog(`start fetch games(id: ${startId}...${startId + api.getGameCount()})`);
            const games = await api.getGames(startId, offset);
            console.log(games);

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
    if(prevData == null){ return; }

    // const igdbLastId = await fetchIgdbLastId(api, prevData.igdb_latest_id)
    // printLog(`lastId: ${igdbLastId}`);

    // const igdbLastId = 278817;
    // const startId = 156235;
    const igdbLastId = 278817;

    const currentGames = await fetchGames(api, prevData.igdb_latest_id, igdbLastId);
    save(prevData.twitch_game_list, currentGames, igdbLastId);
}

await updateGames();