import { TsumoGenerator } from "./puyo.js";

export class SingletonContainer {
    static initialize(puyoSize) {
        this.tsumoGenerator = new TsumoGenerator(puyoSize);
    }
}