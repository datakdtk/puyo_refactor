import { PoppingPuyos, Stage, StaticStage } from "./stage.js";
import { ScoreRenderer, StageRenderer } from "./renderer.js";
import { KeyboardController } from "./controller.js";
import { Tsumo, TsumoGenerator } from "./puyo.js";
import { calculatePoppingScore } from "./score.js";

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

        /** @type {ScoreRenderer} */
        this.scoreRenderer = new ScoreRenderer();
        /** @type {StageRenderer} */
        this.stageRenderer = new StageRenderer();

        this.stage.addObserver(this.stageRenderer);
    }

    firstRender() {
        this.scoreRenderer.firstRender();
        this.stageRenderer.firstRender();
    }

    loop() {
        ++this.frame;

        if (this.isGameOver) {
            this.stageRenderer.renderBatankyuAnimation(this.frame);
            return;
        }

        if (this.currentTsumo) {
            const continueMoving = this.currentTsumo.move(this.stage.columns);
            this.currentTsumo.toStagePuyos().forEach(p => this.stageRenderer.updatePuyoPosition(p))
            if (!continueMoving) {
                this.currentTsumo.toStagePuyos().forEach(p => this.stage.addPuyo(p))
                this.currentTsumo = null;
            }
            return;
        }

        if (this.poppingPuyos) {
            this.stageRenderer.renderPoppingAnimation(this.poppingPuyos, this.frame);
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
            this.stageRenderer.showBatankyuImage();
            return;
        }

        this.tsumoGenerator.proceed();
        this.currentTsumo = this.tsumoGenerator.getCurrentTsumo();
        this.controller.setCurrentTsumo(this.currentTsumo);
        this.stageRenderer.updateNextTsumo(this.tsumoGenerator);
        this.currentTsumo.toStagePuyos().forEach(p => this.stageRenderer.addNewPuyo(p))
    }

    _addScore(additionalAmount) {
        this.score += additionalAmount;
        this.scoreRenderer.updateScore(this.score);
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
