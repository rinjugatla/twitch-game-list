import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { TwitchApi, TwitchApiSetting } from './twitch';
import { TwtichGames } from './types/Twtich';
dotenv.config();

const filepath = "data/games.json";
const fetchIntervalMilliSec = 5000;

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

const printLog = (message: string) => {
    const today = new Date();
    console.info(`[${today.getFullYear()}/${today.getMonth()}/${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}] ${message}`);
}

/**
 * 待機
 * @param milliSec 待機時間
 */
const sleep = (milliSec: number) => new Promise(resolve => setTimeout(resolve, milliSec))

/**
 * ゲーム情報を取得
 * @param api Twitch API
 * @param prevGames 前回の取得結果
 */
const fetchGames = async (api: TwitchApi, prevGames: TwtichGames) => {
    const prevLastIgdbId = prevGames.length === 0 ? 0 : Number(prevGames[prevGames.length - 1].igdb_id);
    let fetchedGames: TwtichGames = [];
    let offset = prevLastIgdbId;
    // データベースに登録されているゲームをすべて取得するため終了条件は未指定とする
    for (let startId = prevLastIgdbId ; true ; startId += api.getGameCount()) {
        try {
            printLog(`start fetch games(id: ${startId}...${startId + api.getGameCount()})`);
            const games = await api.getGames(startId, offset);
            const fetchedLatestGame = games === null || games.length === 0;
            if(fetchedLatestGame) { break; }

            fetchedGames = [...fetchedGames, ...games];
            await sleep(fetchIntervalMilliSec);
        } catch (error) {
            console.error(error);
        }
    }

    return fetchedGames;
}


/**
 * 前回の結果を取得
 * @returns 
 */
const load = () => {
    const existsPrevData = fs.existsSync(filepath);
    if (!existsPrevData){ return []; }
        
    const prevData = fs.readFileSync(filepath);
    const prevGames: TwtichGames = JSON.parse(prevData.toString());
    printLog(`loaded prev games(count: ${prevGames.length}, lastIgdbId: ${prevGames[prevGames.length - 1].igdb_id})`);
    return prevGames;
}

/**
 * 結果をファイルに保存
 * @param prevGames 前回のゲーム情報
 * @param fetchedGames ソートしたゲーム情報
 */
const save = (prevGames: TwtichGames, currentGames: TwtichGames) => {
    const marged = [...prevGames, ...currentGames];
    const uniqued = [...new Set(marged)];
    const sorted = uniqued.sort((a, b) => Number(a.igdb_id) - Number(b.igdb_id));
    fs.writeFileSync(filepath, JSON.stringify(sorted, null, "    "));
    printLog(`saved games(count: ${sorted.length}, lastId: ${sorted[sorted.length - 1].igdb_id})`);
}

/**
 * ゲーム情報を更新
 */
const updateGames = async () => {
    const api = await initTwitchApi();
    const prevGames = load();
    const currentGames = await fetchGames(api, prevGames);
    save(prevGames, currentGames);
}

await updateGames();