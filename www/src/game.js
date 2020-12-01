import { PuyoImage } from "./puyoimage.js";
import { Stage } from "./stage.js";
import { Player } from "./player.js";
import { InitialState } from "./gamestate.js";
import { Renderer } from "./renderer.js";

// 起動されたときに呼ばれる関数を登録する
window.addEventListener("load", () => {
    // まずステージを整える
    initialize();

    // ゲームを開始する
    loop();
});

let state = new InitialState();
const stageSize = {
        cols: 6,
        rows: 12,
}
const fontHeight = 33;
const renderer = new Renderer(stageSize, fontHeight);

function initialize() {
    // 画像を準備する
    PuyoImage.initialize();
    // ステージを準備する
    Stage.initialize();
    // ユーザー操作の準備をする
    Player.initialize();

    renderer.firstRender();
    state.addScoreObserver(renderer);
}

function loop() {
    state = state.nextState();
    requestAnimationFrame(loop); // 1/60秒後にもう一度呼び出す
}
