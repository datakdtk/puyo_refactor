import { PoppingPuyos, Stage } from "./stage.js";
import { KeyboardController } from "./controller.js";
import { Tsumo, TsumoGenerator } from "./puyo.js";
import { calculatePoppingScore, zenkeshiBonus } from "./score.js";
import { Renderer } from "./renderer.js";

export class Game {
    constructor() {
        /** @type {KeyboardController} */
        this.controller = new KeyboardController();
        /** @type {Stage} */
        this.stage = new Stage();
        /** @type {TsumoGenerator} */
        this.tsumoGenerator = new TsumoGenerator();

        this.state = new StatePuyoFalling();

        this.score = 0;
        this.rensaCount = 0;
        this.frame = 0;

        /** @type {Renderer} */
        this.renderer = new Renderer();

        this.stage.addObserver(this.renderer);
    }

    firstRender() {
        this.renderer.firstRender();
    }

    loop() {
        ++this.frame;
        this.state = this.state.process(this);
    }

    _addScore(additionalAmount) {
        this.score += additionalAmount;
        this.renderer.updateScore(this.score);
    }
}

class StateTsumoMoving {
    /**
     * @param {Tsumo} tsumo
     */
    constructor(tsumo) {
        this.tsumo = tsumo;
    }

    process(game) {
        const continueMoving = this.tsumo.move(game.stage.columns);
        this.tsumo.toStagePuyos().forEach(p => game.renderer.updatePuyoPosition(p))
        if (continueMoving) {
            return new StateTsumoMoving(this.tsumo);
        }
        this.tsumo.toStagePuyos().forEach(p => game.stage.addPuyo(p))
        return new StatePuyoFalling();

    }
}

class StatePuyoFalling {
    process(game) {
        const hasFallen = game.stage.puyosFall();
        if (hasFallen) {
            return new StatePuyoFalling();
        }
        
        const newPopping = game.stage.checkPoppingPuyos(game.frame);
        if (newPopping) {
            this._calculatePoppingScore(game, newPopping);
            return new StatePopping(newPopping);
        }
        
        game.rensaCount = 0;

        if (game.stage.isGameOver()) {
            game.renderer.showBatankyuImage();
            return new StateBatankyu();
        }

        const newTsumo = this._updateTsumo(game);
        return new StateTsumoMoving(newTsumo);

    }

    _calculatePoppingScore(game, poppingPuyos) {
        game.rensaCount++;
        const additonalScore = calculatePoppingScore(
            game.rensaCount,
            poppingPuyos.puyoCount,
            poppingPuyos.colorCount
        );
        game._addScore(additonalScore);
        game.renderer.hideZenkeshi();
    }

    _updateTsumo(game) {
        game.tsumoGenerator.proceed();
        game.renderer.updateNextTsumo(game.tsumoGenerator);
        const newTsumo = game.tsumoGenerator.getCurrentTsumo();
        game.controller.setCurrentTsumo(newTsumo);
        newTsumo.toStagePuyos().forEach(p => game.renderer.addNewPuyo(p))
        return newTsumo
    }
}

class StatePopping {
    /**
     * @param {PoppingPuyos} poppingPuyos
     */
    constructor(poppingPuyos) {
        this.poppingPuyos = poppingPuyos;
    }

    process(game) {
        game.renderer.renderPoppingAnimation(this.poppingPuyos, game.frame);
        if (!this.poppingPuyos.finishedPopping(game.frame)) {
            return new StatePopping(this.poppingPuyos);
        }
        if (game.stage.isZenkeshi()) {
            game._addScore(zenkeshiBonus);
            game.renderer.showZenkeshi();
        }
        return new StatePuyoFalling();
    }
}

class StateBatankyu {
    process(game) {
        game.renderer.renderBatankyuAnimation(game.frame);
        return new StateBatankyu();
    }
}
