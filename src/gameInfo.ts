import * as fs from 'fs';
import { GameInfo } from './types/GameInfo';
import { printLog } from './common';
import { TwtichGames } from './types/Twtich';
const filepath = "data/games.json";

/**
 * 前回の結果を取得
 * @returns 
 */
export const load = () => {
    const existsPrevData = fs.existsSync(filepath);
    if (!existsPrevData){ return null; }
        
    const prevData = fs.readFileSync(filepath);
    const prevInfo: GameInfo = JSON.parse(prevData.toString());
    const gameList = prevInfo.twitch_game_list;
    printLog(`loaded prev games(count: ${gameList.length}, lastIgdbId: ${gameList[gameList.length - 1].igdb_id})`);
    return prevInfo;
}

/**
 * 結果をファイルに保存
 * @param prevGames 前回のゲーム情報
 * @param currentGames 今回取得したゲーム情報
 */
export const save = (prevGames: TwtichGames, currentGames: TwtichGames, igdbLastId: number) => {
    const marged = [...prevGames, ...currentGames];
    const uniqued = [...new Set(marged)];
    const sorted = uniqued.sort((a, b) => Number(a.igdb_id) - Number(b.igdb_id));
    const date = {
        igdb_latest_id: igdbLastId,
        twitch_game_list: sorted
    }
    fs.writeFileSync(filepath, JSON.stringify(date, null, "    "));
    printLog(`saved games(count: ${sorted.length}, lastId: ${date.igdb_latest_id})`);
}
