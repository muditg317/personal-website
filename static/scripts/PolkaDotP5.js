/* eslint no-multiple-empty-lines: off */
/* eslint indent: off */
let polkaDot = new p5((p) => {
const INITIAL_SIZE = 25;
const MAX_SIZE = 150;
const MIN_SIZE = 20;
const MAX_PERC_DIFF = 0.02;

const MAX_ENEMIES = 20;
const FPS = 60;
const ENEMY_SPAWN_RATE = 10;
const PROB_CAN_EAT = 0.05;
const MIN_SPEED = 1;
const MAX_SPEED = 5;

const SCALE = 1;

let enemies;
let player;
let score;

let gameStarted = false;
let lost;
let paused = false;

p.setup = function () {
    let canvas = p.createCanvas(600, 600);
    canvas.id('polkaDotCanvas');
    let canvasElement = canvas.elt;
    canvasElement.addEventListener('mousedown', (e) => {
        e.preventDefault();
        handleEvent();
    });
    canvasElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleEvent();
    });

    p.noStroke();
    setupGame();
    lose();
};

const drawBackground = () => {
    p.background(106, 219, 216);
};

const setupGame = () => {
    player = new Player();
    enemies = [];
    score = 0;
    lost = false;
    drawBackground();
    p.loop();
};

const lose = () => {
    lost = true;
    p.noLoop();
};

const update = () => {
    player.update();
    let dead = [];
    enemies.forEach((enemy, index) => {
        let update = enemy.update(player);
        if (update === 1) {
            dead.push(enemy);
        } else if (update === 2) {
            dead.push(enemy);
            player.size += 1;
            score += 1;
            player.score += 1;
        } else if (update === 3) {
            lose();
        }
    });
    enemies = enemies.filter((enemy) => {
        return !dead.includes(enemy);
    });
    if (enemies.length < MAX_ENEMIES && p.frameCount % (FPS / ENEMY_SPAWN_RATE) === 0) {
        enemies.push(new Dot());
    }
};

p.draw = function () {
    if (!lost) {
        update();
        drawBackground();
        enemies.forEach((enemy) => {
            enemy.draw();
        });
        player.draw();
    }
};


p.keyTyped = function (e) {
    if (p.key === '2' && !gameStarted) {
        e.preventDefault();
        handleEvent();
    }
    if (p.key === ' ' && gameStarted && !lost) {
        e.preventDefault();
        togglePause();
    }
};

const handleEvent = () => {
    if (!gameStarted) {
        gameStarted = true;
    }
    if (!lost) {
        if (paused) {
            togglePause();
        }
    } else {
        setupGame();
    }
};

const togglePause = () => {
    paused = !paused;
    if (paused) {
        p.noLoop();
    } else {
        p.loop();
    }
};

class Dot {
    constructor ({size = this.randomSize(), x = Math.random() * p.width, y = Math.random() * p.height, color = [], isPlayer = false} = {}) {
        this.size = size;
        this.x = x;
        this.y = y;
        // this.vx = p.map(size, MIN_SIZE, MAX_SIZE, MAX_SPEED, 0) * (1 + (Math.random() * 0.4 - 0.2)) / Math.sqrt(2);
        // // Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
        // this.vy = p.map(size, MIN_SIZE, MAX_SIZE, MAX_SPEED, 0) * (1 + (Math.random() * 0.4 - 0.2)) / Math.sqrt(2);
        // // Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
        let speed = p.map(size, MIN_SIZE, MAX_SIZE, MAX_SPEED, MIN_SPEED) * (1 + (Math.random() * 0.4 - 0.2));
        let angle = Math.random() * Math.PI / 2;
        this.vx = speed * Math.cos(angle);
        this.vy = speed * Math.sin(angle);
        // while ((speed = Math.pow(Math.pow((this.vx), 2) + Math.pow((this.vy), 2), 0.5)) < MIN_SPEED) {
        //     this.vx *= MIN_SPEED / speed;
        //     this.vy *= MIN_SPEED / speed;
        // }
        if (!isPlayer) {
            if (Math.random() < 0.5) {
                if (Math.random() < 0.5) {
                    this.x = -this.size;
                } else {
                    this.x = p.width + this.size;
                    this.vx *= -1;
                }
                if (Math.random() < 0.5) {
                    this.vy *= -1;
                }
            } else {
                if (Math.random() < 0.5) {
                    this.y = -this.size;
                } else {
                    this.y = p.height + this.size;
                    this.vy *= -1;
                }
                if (Math.random() < 0.5) {
                    this.vx *= -1;
                }
            }
        }
        this.color = color;
        if (color.length === 0) {
            this.color = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
        }
    }
    randomSize () {
        let min = MIN_SIZE < player.size - 35 ? player.size - 35 : MIN_SIZE;
        let max = MAX_SIZE > player.size + 100 ? player.size + 100 : MAX_SIZE;
        return (Math.random() < PROB_CAN_EAT ? Math.random() * (player.size - min) : (Math.random() * (max - min) / 2 + Math.random() * (player.size - min) / 2)) + min;
    }
    update (player) {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -this.size || this.x > p.width + this.size || this.y < -this.size || this.y > p.height + this.size) {
            return 1;
        }
        if (Math.pow(Math.pow((this.x - player.x), 2) + Math.pow((this.y - player.y), 2), 0.5) < ((this.size + player.size) * SCALE / 2)) {
            return this.size / player.size <= (1 + MAX_PERC_DIFF) ? 2 : 3;
        }
    }
    draw () {
        p.push();
        p.fill(...this.color);
        p.ellipse(this.x, this.y, SCALE * this.size);
        p.pop();
    }
}

class Player extends Dot {
    constructor (size = INITIAL_SIZE) {
        super({size: size, color: [200, 200, 200], isPlayer: true, x: p.width / 2, y: p.height / 2});
        this.score = 0;
    }
    update () {
        this.x = p.mouseX;
        this.y = p.mouseY;
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x > p.width) {
            this.x = p.width;
        }
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y > p.height) {
            this.y = p.height;
        }
    }
    draw () {
        p.push();
        super.draw();
        p.textAlign(p.CENTER, p.CENTER);
        p.text(this.score, this.x, this.y);
        p.pop();
    }
}
}, 'polkaDotContainer');
