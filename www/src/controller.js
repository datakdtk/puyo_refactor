import { COMMAND_MOVE_LEFT, COMMAND_MOVE_RIGHT, COMMAND_QUICK_TURN, COMMAND_TURN_LEFT, COMMAND_TURN_RIGHT, Tsumo } from "./puyo.js";

const KEYCODE_TO_MOVE_LEFT = 37; // 左矢印キー
const KEYCODE_TO_MOVE_RIGHT = 39; // 右矢印キー
const KEYCODE_TO_TURN_LEFT =90; // zキー
const KEYCODE_TO_TURN_RIGHT =88; // xキー
const KEYCODE_TO_DROP = 40; // 下矢印キー


const quickTurnIntervalMs = 500;
export class KeyboardController {
    /** @type {Tsumo|null} */
    currentTsumo = null;



    constructor() {
        this.lastTurningCommandTime = new Date()
        document.addEventListener('keydown', (e) => {
            // キーボードが押された場合
            switch (e.keyCode) {
                case KEYCODE_TO_MOVE_LEFT:
                    if (this.currentTsumo) {
                        this.currentTsumo.addCommand(COMMAND_MOVE_LEFT);
                    }
                    break;
                case KEYCODE_TO_MOVE_RIGHT:
                    if (this.currentTsumo) {
                        this.currentTsumo.addCommand(COMMAND_MOVE_RIGHT);
                    }
                    break;
                case KEYCODE_TO_TURN_LEFT:
                    if (this.currentTsumo) {
                        this._tryToInputQuickTurn();
                        this.currentTsumo.addCommand(COMMAND_TURN_LEFT);
                    }
                    break;
                case KEYCODE_TO_TURN_RIGHT:
                    if (this.currentTsumo) {
                        this._tryToInputQuickTurn();
                        this.currentTsumo.addCommand(COMMAND_TURN_RIGHT);
                    }
                    break;
                case KEYCODE_TO_DROP:
                    if (this.currentTsumo) {
                        this.currentTsumo.enableFastDropping();
                    }
                    break;
            }
        });
        document.addEventListener('keyup', (e) => {
            // キーボードが離された場合
            switch (e.keyCode) {
                case KEYCODE_TO_DROP:
                    if (this.currentTsumo) {
                        this.currentTsumo.disableFastDropping();
                    }
                    break;
            }
        });

    }

    setCurrentTsumo(tsumo) {
        this.currentTsumo = tsumo;
    }

    _tryToInputQuickTurn() {
        const oldImputTimeMs = this.lastTurningCommandTime.getTime();
        this.lastTurningCommandTime = new Date();
        const interval = this.lastTurningCommandTime.getTime() - oldImputTimeMs;
        if (interval <= quickTurnIntervalMs) {
            this.currentTsumo.addCommand(COMMAND_QUICK_TURN);
            return true;
        }
        return false;
    }
}