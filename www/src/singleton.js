import { TsumoGenerator } from "./puyo.js";
import { Stage } from "./stage.js";

export class SingletonContainer {
    static initialize() {
        this.tsumoGenerator = new TsumoGenerator();
        this.stage = new Stage();
    }
}