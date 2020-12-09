import { PuyoImage } from "./puyoimage.js";
import { Stage } from "./stage.js";
import { Player } from "./player.js";
import { zenkeshiBonus, calculatePoppingScore } from "./score.js";

class AbstractState {
    frame = 0;
    rensaCount = 0;
    score = 0;

    scoreObservers = [];


    constructor(previous) {
        this.frame = previous.frame + 1;
        this.rensaCount = previous.rensaCount;
        this.score = previous.score;

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

    scoreObservers = [];

    addScoreObserver(observer) {
        this.scoreObservers.push(observer);
    }

    nextState() {
        return checkFall(this);
     }
}

class Falling extends AbstractState {
    nextState() {
        return Stage.fall() ? new Falling(this) : checkErase(this);
    }
}

class Erasing extends AbstractState {
    nextState() {
        return Stage.erasing(this.frame) ? new Erasing(this) : checkFall(this);
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
        let mode = action; // 'playing' 'moving' 'rotating' 'fix' のどれかが帰ってくる
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

function checkFall(state) {
    return Stage.checkFall() ? new Falling(state) : checkErase(state);
}

function checkErase(state) {
    const eraseInfo = Stage.checkErase(state.frame);
    if (eraseInfo) {
        state.rensaCount++;
        // 得点を計算する
        state.addScore(calculatePoppingScore(state.rensaCount, eraseInfo.piece, eraseInfo.color));
        Stage.hideZenkeshi();
        return new Erasing(state);
    } else {
        if (Stage.puyoCount === 0 && state.rensaCount > 0) {
            // 全消しの処理をする
            Stage.showZenkeshi();
            state.addScore(zenkeshiBonus);
        }
        state.rensaCount = 0;
        // 消せなかったら、新しいぷよを登場させる
        return createNewPuyo(state);
    }
}

function createNewPuyo(state) {
    return Player.createNewPuyo() ? new Playing(state) : new GameOver(state);
}

function fixPuyo(state) {
    Player.fix()
    return checkFall(state);
}
