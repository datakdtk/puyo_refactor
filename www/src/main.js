import { Game } from "./game.js";
    
const g = new Game();
// 起動されたときに呼ばれる関数を登録する
function loop() {
    g.loop();
    requestAnimationFrame(loop); // 1/60秒後にもう一度呼び出す
}

window.addEventListener("load", () => {
    g.firstRender();
    loop();
});
