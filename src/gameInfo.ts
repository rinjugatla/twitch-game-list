import * as fs from 'fs';
import { GameInfo } from './types/GameInfo';
import { printLog } from './common';
import { TwtichGames } from './types/Twtich';
import archiver from 'archiver';

const dataPath = `data/games.json`;
const dataMinPath = `data/games.min.json`;
const dataZipPath = `data/games.zip`;
/**
 * 前回の結果を取得
 * @returns 
 */
export const load = () => {
    const existsPrevData = fs.existsSync(dataMinPath);
    if (!existsPrevData){ return null; }
        
    const prevData = fs.readFileSync(dataMinPath);
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
export const save = (prevGames: GameInfo | null, currentGames: TwtichGames, igdbLastId: number) => {
    const existsNewGames = currentGames != null && currentGames.length > 0;
    if(!existsNewGames) { 
        printLog(`not changed.`);
        return; 
    }
    
    const prev = prevGames === null ? [] : prevGames.twitch_game_list;
    const marged = [...prev, ...currentGames];
    const uniqued = [...new Map(marged.map((game) => [game.igdb_id, game])).values()];
    const sorted = uniqued.sort((a, b) => Number(a.igdb_id) - Number(b.igdb_id));
    const data = {
        igdb_latest_id: igdbLastId,
        twitch_game_list: sorted
    } as GameInfo
    fs.writeFileSync(dataPath, JSON.stringify(data, null, "    "));
    fs.writeFileSync(dataMinPath, JSON.stringify(data));
    createArchive(data);
    printLog(`saved games(count: ${sorted.length}, lastId: ${data.igdb_latest_id})`);
}

/**
 * 結果をZipファイルに保存
 * @param data Twitchゲーム情報
 */
const createArchive = (data: GameInfo) => {
    const output = fs.createWriteStream(dataZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);
    
    archive.append(JSON.stringify(data), {name: "games.json"});
    archive.finalize();
}