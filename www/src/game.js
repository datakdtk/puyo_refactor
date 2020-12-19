import { PoppingPuyos, Stage } from "./stage.js";
import { KeyboardController } from "./controller.js";
import { Tsumo, TsumoGenerator } from "./puyo.js";
import { calculatePoppingScore } from "./score.js";
import { Renderer } from "./renderer.js";

class Game {
    constructor() {
        /** @type {KeyboardController} */
        this.controller = new KeyboardController();

        /** @type {Stage} */
        this.stage = new Stage();

        /** @type {TsumoGenerator} */
        this.tsumoGenerator = new TsumoGenerator();

        /** @type {Tsumo} */
        this.currentTsumo = null;

        /** @type {PoppingPuyos} */
        this.poppingPuyos = null;

        this.score = 0;
        this.rensaCount = 0;
        this.frame = 0;
        this.isGameOver = false;

        /** @type {Renderer} */
        this.renderer = new Renderer();

        this.stage.addObserver(this.renderer);
    }

    firstRender() {
        this.renderer.firstRender();
    }

    loop() {
        ++this.frame;

        if (this.isGameOver) {
            this.renderer.renderBatankyuAnimation(this.frame);
            return;
        }

        if (this.currentTsumo) {
            const continueMoving = this.currentTsumo.move(this.stage.columns);
            this.currentTsumo.toStagePuyos().forEach(p => this.renderer.updatePuyoPosition(p))
            if (!continueMoving) {
                this.currentTsumo.toStagePuyos().forEach(p => this.stage.addPuyo(p))
                this.currentTsumo = null;
            }
            return;
        }

        if (this.poppingPuyos) {
            this.renderer.renderPoppingAnimation(this.poppingPuyos, this.frame);
            if (this.poppingPuyos.finishedPopping(this.frame)) {
                this.poppingPuyos = null;
            }
            return;
        }

        const hasFallen = this.stage.puyosFall();
        if (hasFallen) {
            return;
        }
        
        const newPopping = this.stage.checkPoppingPuyos(this.frame);
        if (newPopping) {
            this.poppingPuyos = newPopping;
            this.rensaCount++;
            const additonalScore = calculatePoppingScore(
                this.rensaCount,
                this.poppingPuyos.puyoCount,
                this.poppingPuyos.colorCount
            );
            this._addScore(additonalScore);
            return;
        } else {
            this.rensaCount = 0;
        }

        if (this.stage.isGameOver()) {
            this.isGameOver = true;
            this.renderer.showBatankyuImage();
            return;
        }

        this.tsumoGenerator.proceed();
        this.currentTsumo = this.tsumoGenerator.getCurrentTsumo();
        this.controller.setCurrentTsumo(this.currentTsumo);
        this.renderer.updateNextTsumo(this.tsumoGenerator);
        this.currentTsumo.toStagePuyos().forEach(p => this.renderer.addNewPuyo(p))
    }

    _addScore(additionalAmount) {
        this.score += additionalAmount;
        this.renderer.updateScore(this.score);
    }
}

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
