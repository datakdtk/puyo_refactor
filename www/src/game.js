import { PuyoImage } from "./puyoimage.js";
import { StaticStage } from "./stage.js";
import { Player } from "./player.js";
import { InitialState } from "./gamestate.js";
import { Renderer } from "./renderer.js";
import { SingletonContainer } from "./singleton.js";

// 起動されたときに呼ばれる関数を登録する
window.addEventListener("load", () => {
    // まずステージを整える
    initialize();

    // ゲームを開始する
    loop();
});

let state = null;
const stageSize = {
        cols: 6,
        rows: 12,
}
const fontHeight = 33;
const renderer = new Renderer();

function initialize() {
    // 画像を準備する
    PuyoImage.initialize();
    // ステージを準備する
    StaticStage.initialize();
    // ユーザー操作の準備をする
    Player.initialize();

    SingletonContainer.initialize(renderer.puyoSize);
    state = new InitialState(SingletonContainer.stage);

    renderer.firstRender();
    state.addScoreObserver(renderer.scoreRenderer);
    SingletonContainer.tsumoGenerator.addOvserver(renderer.tsumoRenderer);
    SingletonContainer.stage.addObserver(renderer.stageRenderer);
}

function loop() {
    state = state.nextState();
    requestAnimationFrame(loop); // 1/60秒後にもう一度呼び出す
}
