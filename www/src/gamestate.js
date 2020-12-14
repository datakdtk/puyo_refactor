import { PuyoImage } from "./puyoimage.js";
import { Player } from "./player.js";
import { zenkeshiBonus, calculatePoppingScore } from "./score.js";
import { renderPoppingAnimation } from "./renderer.js";

class AbstractState {
    frame = 0;
    rensaCount = 0;
    score = 0;
    poppingPuyos = null;

    scoreObservers = [];


    constructor(previous) {
        this.frame = previous.frame + 1;
        this.rensaCount = previous.rensaCount;
        this.score = previous.score;
        this.stage = previous.stage;
        this.poppingPuyos = previous.poppingPuyos;

        this.scoreObservers = previous.scoreObservers;
    }

    addScore(additionalAmount) {
        this.score += additionalAmount;
        this.scoreObservers.forEach(o => o.updateScore(this.score))
    }

    nextState() {
        throw "nextState is not defined";
    }
}

export class InitialState {
    frame = 0;
    rensaCount = 0;
    score = 0;
    poppingPuyos = null;

    scoreObservers = [];

    constructor(stage) {
        this.stage = stage;
    }

    addScoreObserver(observer) {
        this.scoreObservers.push(observer);
    }

    nextState() {
        return new NotPlaying(this);
     }
}

class NotPlaying extends AbstractState {
    nextState() {
        if (this.poppingPuyos) {
            renderPoppingAnimation(this.poppingPuyos, this.frame);
            if (this.poppingPuyos.finishedPopping(this.frame)) {
                this.poppingPuyos = null;
            }
            return new NotPlaying(this);
        }

        const hasFallen = this.stage.puyosFall();
        if (hasFallen) {
            return new NotPlaying(this);
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
            this.addScore(additonalScore);
            return new NotPlaying(this);
        }

        this.rensaCount = 0;
        return createNewPuyo(this);
    }
    
}

class Moving extends AbstractState {
    nextState() {
        return Player.moving(this.frame) ? new Moving(this) : new Playing(this);
    }
}

class Rotating extends AbstractState {
    nextState() {
        return Player.rotating(this.frame) ? new Rotating(this) : new Playing(this);
    }
}

class Playing extends AbstractState {
    nextState() {
        const action = Player.playing(this.frame);
        let mode = action; // 'playing' 'moving' 'rotating' 'fix' ‚Ì‚Ç‚ê‚©‚ª‹A‚Á‚Ä‚­‚é
        switch (mode) {
            case "moving":
                return new Moving(this);
            case "rotating":
                return new Rotating(this);
            case "fix":
                return fixPuyo(this);
            default:
                return new Playing(this);
        }
    }
}

class GameOver extends AbstractState {
    nextState() {
        PuyoImage.prepareBatankyu(this.frame);
        return new Batankyu(this);
    }
}

class Batankyu extends AbstractState {
    nextState() {
        PuyoImage.batankyu(this.frame);
        Player.batankyu();
        return new Batankyu(this);
    }
}

function createNewPuyo(state) {
    return Player.createNewPuyo() ? new Playing(state) : new GameOver(state);
}

function fixPuyo(state) {
    Player.fix()
    return new NotPlaying(state);
}
