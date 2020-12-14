import { Config, puyoSize } from  "./config.js";
import { StaticStage } from  "./stage.js";

export class PuyoImage {

    // static puyoImages;
    // static batankyuImage;
    // static gameOverFrame;

    static initialize() {
        this.puyoImages = [];
        for(let i = 0; i < 5; i++) {
            const image = document.getElementById(`puyo_${i + 1}`);
            image.removeAttribute('id');
            image.width = puyoSize;
            image.height = puyoSize;
            image.style.position = 'absolute';
            this.puyoImages[i] = image;
        }
        this.batankyuImage = document.getElementById('batankyu');
        this.batankyuImage.width = puyoSize * 6;
        this.batankyuImage.style.position = 'absolute';
    }

    static getPuyo(index) {
        const image = this.puyoImages[index - 1].cloneNode(true);
        return image;
    }

    static prepareBatankyu(frame) {
        this.gameOverFrame = frame;
        StaticStage.stageElement.appendChild(this.batankyuImage);
        this.batankyuImage.style.top = -this.batankyuImage.height + 'px';
    }

    static batankyu(frame) {
        const ratio = (frame - this.gameOverFrame) / Config.gameOverFrame;
        const x = Math.cos(Math.PI / 2 + ratio * Math.PI * 2 * 10) * puyoSize;
        const y = Math.cos(Math.PI + ratio * Math.PI * 2) * puyoSize * Config.stageRows / 4 + puyoSize * Config.stageRows / 2;
        this.batankyuImage.style.left = x + 'px';
        this.batankyuImage.style.top = y + 'px';
    }
}
