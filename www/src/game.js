import { Config } from  "./config.js";
import { PuyoImage } from "./puyoimage.js";
import { Stage } from "./stage.js";
import { Player } from "./player.js";
import { Score } from "./score.js";
import { InitialState } from "./gamestate.js";

// 起動されたときに呼ばれる関数を登録する
window.addEventListener("load", () => {
    // まずステージを整える
    initialize();

    // ゲームを開始する
    loop();
});

let state = new InitialState();

function initialize() {
    // 画像を準備する
    PuyoImage.initialize();
    // ステージを準備する
    Stage.initialize();
    // ユーザー操作の準備をする
    Player.initialize();
    // シーンを初期状態にセットする
    Score.initialize();
}

function loop() {
    state = state.nextState();
    requestAnimationFrame(loop); // 1/60秒後にもう一度呼び出す
}
