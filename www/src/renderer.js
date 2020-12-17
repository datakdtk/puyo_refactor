import { puyoSize, stageCols, stageRows, fontHeight } from "./config.js";
import { StagePuyo } from "./puyo.js";

const stageBackgroundColor = '#ffffff'; // �X�e�[�W�̔w�i�F
const scoreBackgroundColor = '#24c0bb'; // �X�R�A�̔w�i�F

export class Renderer {
    constructor() {
        this.scoreRenderer = new ScoreRenderer();
        this.stageRenderer = new StageRenderer();
        this.tsumoRenderer = new TsumoRenderer();
    }

    firstRender() {
        this.scoreRenderer.firstRender();
        this.stageRenderer.firstRender();
    }
}

class ScoreRenderer {
    fontTemplateList = []


    constructor() {
        this.scoreElement = document.getElementById("score");

        let fontWidth = 0;
        for (let i = 0; i < 10; i++) {
            const fontImage = document.getElementById(`font${i}`);
            if (fontWidth === 0) {
                fontWidth = fontImage.width / fontImage.height * fontHeight;
            }
            fontImage.height = fontHeight;
            fontImage.width = fontWidth;
            this.fontTemplateList.push(fontImage);
        }

        this.fontLength = Math.floor(stageCols * puyoSize / this.fontTemplateList[0].width);
    }

    firstRender() {
        this.scoreElement.style.backgroundColor = scoreBackgroundColor;
        this.scoreElement.style.top = puyoSize * stageRows + 'px';
        this.scoreElement.style.width = puyoSize * stageCols + 'px';
        this.scoreElement.style.height = fontHeight + "px";
        this.updateScore(0);
    }

    updateScore(score) {
        let unprinted_numbers = score;
        // �܂��ŏ��ɁAscoreElement �̒��g������ۂɂ���
        while(this.scoreElement.firstChild) {
            this.scoreElement.removeChild(this.scoreElement.firstChild);
        }
        // �X�R�A�����̌����疄�߂Ă���
        for(let i = 0; i < this.fontLength; i++) {
            // 10�Ŋ��������܂�����߂āA��ԉ��̌������o��
            const number = unprinted_numbers % 10;
            // ��Ԃ�����ɒǉ�����̂ł͂Ȃ��A��ԑO�ɒǉ����邱�ƂŁA�X�R�A�̕��т𐔎��Ɠ����悤�ɂ���
            this.scoreElement.insertBefore(this.fontTemplateList[number].cloneNode(true), this.scoreElement.firstChild);
            // 10 �Ŋ����Ď��̌��̏��������Ă���
            unprinted_numbers = Math.floor(unprinted_numbers / 10);
        }
    }

}


class StageRenderer {
    constructor() {
        this.stageElement = document.getElementById("stage");

    }

    firstRender() {
        // HTML ����X�e�[�W�̌��ƂȂ�v�f���擾���A�傫����ݒ肷��
        this.stageElement.style.width = puyoSize * stageCols + 'px';
        this.stageElement.style.height = puyoSize * stageRows + 'px';
        this.stageElement.style.backgroundColor = stageBackgroundColor;

        const nextElement = document.getElementById("next");
        nextElement.style.width = puyoSize + 'px';
        nextElement.style.height = puyoSize * 2 + 'px';

        const nextnextElement = document.getElementById("next-next");
        nextnextElement.style.width = puyoSize + 'px';
        nextnextElement.style.height = puyoSize * 2 + 'px';
    }

    /**
     * ��ʂɂՂ��ǉ�����
     * @param {StagePuyo} puyo
     */
    addNewPuyo(puyo) {
        const element = document.createElement("img");
        element.id = puyo.id;
        element.src = imageSorcePath(puyo.color);
        element.style.width = puyoSize + "px";
        element.style.height = puyoSize + "px";
        element.style.position = "absolute";
        element.style.left = puyo.positionX + "px";
        element.style.top = puyo.positionY + "px";

        this.stageElement.appendChild(element);
    }

    /**
     * �Ղ�̈ʒu�ω�����ʂɔ��f������ 
     * @param {StagePuyo} puyo
     */
    updatePuyoPosition(puyo) {
        const element = document.getElementById(puyo.id);
        element.style.left = puyo.positionX + "px";
        element.style.top = puyo.positionY + "px";
    }

}

/**
 * �Ղ�����G�t�F�N�g�̕`��
 * @param {PoppingPuyos} poppingPuyos
 * @param {number} currentFrame
 */
export function renderPoppingAnimation(poppingPuyos, currentFrame) {
    const ratio = poppingPuyos.poppingProgressRate(currentFrame);
    if (ratio >= 1) {
        // �A�j���[�V�������I������
        const stageElement = document.getElementById("stage");
        poppingPuyos.puyoIds.forEach(id => {
            var element = document.getElementById(id);
            if (element) {
                stageElement.removeChild(element);
            }
        });
        return;
    }

    const display = ratio > 0.75 || (ratio < 0.50 && ratio > 0.25) ? "block" : "none";
    poppingPuyos.puyoIds.forEach(id => {
        var element = document.getElementById(id);
        element.style.display = display;
    });
}

class TsumoRenderer {
    updateTsumo(tsumoGenerator) {
        const next = tsumoGenerator.getNextTsumo();
        document.getElementById("next-jiku-puyo").src = imageSorcePath(next.jikuColor);
        document.getElementById("next-child-puyo").src = imageSorcePath(next.childColor);
  
        const nextnext = tsumoGenerator.getNextNextTsumo();
        document.getElementById("next-next-jiku-puyo").src = imageSorcePath(nextnext.jikuColor);
        document.getElementById("next-next-child-puyo").src = imageSorcePath(nextnext.childColor);
    }
}

function imageSorcePath(colorInt) {
    return `./img/puyo_${colorInt}.png`
}
