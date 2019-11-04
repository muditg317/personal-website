let level;
let rowsPerLevel;

let baseBlocks;
let fallingBlocks;

let tileSize;
let size;
let margin;
let marginRatio;

let canvasWidth;
let canvasHeight;

let shiftsPerSecond;
let dropsPerSecond;

let blockWidth;
let score;
let lost;


let shifting;
let continueShifting;
let shift;
let increment;

let ghostBlocks;

let highscore = 0;

let gameStarted = false;

function setup() {
  let canvas = createCanvas(462,660);
  canvas.id("stackerCanvas");
  canvasElement = document.getElementById("stackerCanvas");
  canvasElement.addEventListener("mousedown", (e) => {
      e.preventDefault();
      handleEvent();
  });
  canvasElement.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleEvent();
  });
  document.getElementById("stackerContainer").appendChild(canvasElement);

  marginRatio = 1/10.0;
  rowsPerLevel = 1;
  canvasWidth = 7;
  canvasHeight = canvasWidth*height/width;

  setupGame();
  lose();

}

function setupGame() {
    continueShifting = true;
    shift = 0;

    //parseFile();
    //console.log(highscore);

    tileSize = width/canvasWidth;
    size = tileSize*1.0/(1+marginRatio*2);
    margin = size*marginRatio;

    noStroke();
    //drawBackground();

    baseBlocks = [];
    fallingBlocks = [];
    score = 0;
    level = 1;
    lost = false;
    blockWidth = 3;

    shiftsPerSecond = shiftsByLevel();
    dropsPerSecond = dropsByLevel();

    let baseBlock = new BlockRow((canvasWidth-blockWidth)/2, canvasHeight-1, blockWidth, score);
    baseBlock.disable();
    baseBlocks.splice(0,0,baseBlock);

    spawnBlock();

    shifting = false;
    continueShifting = true;

    ghostBlocks = [];
}

//function parseFile() {
//  BufferedReader reader = createReader("highscore.txt");
//  let line = null;
//  if (reader == null) {
//    return;
//  }
//  try {
//    while ((line = reader.readLine()) != null) {
//      highscore = parseInt(line);
//    }
//    reader.close();
//  } catch (IOException e) {
//    e.prletStackTrace();
//  }
//}



function draw() {
  if (shifting) {
    shift += increment;
    translate(0,shift);
    if (shift >= tileSize*rowsPerLevel-increment) {
      shifting = continueShifting;
      shift = 0;
      for (let i = 0; i < rowsPerLevel && baseBlocks.length > 0; i++) {
        baseBlocks.splice(0,1);//[0].disable();
      }
      if (baseBlocks.length == 0) {
        lose();
      }
      baseBlocks.forEach( (row) => {
        row.drop(rowsPerLevel,row);
      });
      fallingBlocks.forEach( (row) => {
        row.drop(rowsPerLevel,row);
      });
      ghostBlocks.forEach( (block) => {
        block.y += tileSize*rowsPerLevel;
      });
      resetMatrix();
    }
  }
  drawBackground();
  //strokeWeight(10);
  line(0,tileSize*rowsPerLevel,width,tileSize*rowsPerLevel);
  //noStroke();
  //console.log(baseBlocks);
  baseBlocks.forEach( (block) => {
    //console.log(block);
    block.draw();
  });
  if (!lost) {
    fallingBlocks.forEach( (block) => {
      //console.log(block);
      block.draw();
    });
  } else {
  }
  for (let i = 0; i < ghostBlocks.length; i++) {
    let block = ghostBlocks[i];
    block.update();
    if (block.y > height) {
      ghostBlocks.splice(i--,1);
    }
    block.draw();
  }
}

const drawBackground = () => {
  translate(0,shift);
  background(190,0,190);
  fill(120,0,120);
  let startHeight = 0;
  if (shifting) {
    startHeight -= shift/tileSize+1;
    // console.log(startHeight);
  }
  for (let i = 0; i < canvasWidth; i++) {
    for (let j = startHeight; j < canvasHeight; j++) {
      //if (j == startHeight) {
      //  fill(255,0,0);
      //} else {
      //  fill(120,0,120);
      //}
      rect(margin + i*(size+margin*2), margin + j*(size+margin*2), size, size);
    }
  }
  translate(0,-shift);
};

const spawnBlock = () => {
  let newRow;
  newRow = new BlockRow(Math.floor(Math.random()*(canvasWidth-blockWidth)), baseBlocks[baseBlocks.length-1].y-1, blockWidth, score+1);
  // newRow = new BlockRow(Math.floor(Math.random()*(canvasWidth-blockWidth)), 0, blockWidth, score+1);
  // if (Math.random() < 0.5) {
    // newRow = new BlockRow(Math.floor((canvasWidth-blockWidth)/2), baseBlocks[baseBlocks.length-1].y-1, blockWidth, score+1);
  // } else {
      // newRow = new BlockRow(baseBlocks[baseBlocks.length-1].x, baseBlocks[baseBlocks.length-1].y-1, blockWidth, score+1);
  // }
  fallingBlocks.push(newRow);
};


function keyPressed() {
    if (key == '1' && !gameStarted) {
        handleEvent();
    }
    if (key == ' ' && gameStarted) {
        handleEvent();
    }
}

const handleEvent = () => {
    if (!gameStarted) {
        gameStarted = true;
    }
    if (!lost) {
        dropBlock();
    } else {
        setupGame();
    }
}

const dropBlock = () => {
  let base = baseBlocks[baseBlocks.length-1];
  let lowest = fallingBlocks[0];
  if (lowest.canLand(base)) {
    let newGhostBlocks = lowest.landOn(base);
    blockWidth -= newGhostBlocks.length;
    newGhostBlocks.forEach( (element) => {
      ghostBlocks.push(element);
    });
    baseBlocks.push(fallingBlocks.splice(0,1)[0]);
    score++;
    //console.log("Nice! You've stacked",score,"blocks!");
    if (score % rowsPerLevel == 0) {
      level++;
      //console.log("Nice! You've reached level",level + "!");
      shiftsPerSecond = shiftsByLevel();
      dropsPerSecond = dropsByLevel();
      if (level > 5) {
        shiftScreen();
      }
    }
    spawnBlock();
  } else {
    lose();
  }
};

const lose = () => {
  lost = true;
  continueShifting = false;
  console.log("You stacked",score,"blocks!");
  //if (score > highscore) {
  //  PrletWriter highscoreWriter = createWriter("highscore.txt");
  //  highscoreWriter.console.log(score);
  //  highscoreWriter.flush();
  //  highscoreWriter.close();
  //}
  while (fallingBlocks.length > 0) {
    let blockRow = fallingBlocks.splice(0,1)[0];
    blockRow.disable();
    blockRow.blocks.forEach( (element) => {
      ghostBlocks.push(element);
    });
  }
};

const shiftsByLevel = () => {
  return 2+level;
};

const dropsByLevel = () => {
  // return level <= 3 ? 1f/(4-level) : level-2;
  return 0.0000001;
};

const shiftScreen = () => {
  shifting = true;
  increment = (Math.pow(level,0.1));
};

class Block {


  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;

    this.gravity = 0.2;
    this.speed = 0;

    this.rotation = 0;
    this.rotationSpeed = 0.1;

    this.alpha = 255;
    this.alphaDecay = 0.99;
  }

  update() {
    this.speed += this.gravity;
    this.y += this.speed;
    this.rotation += this.rotationSpeed;
    this.alpha *= this.alphaDecay;
  }

  draw() {
    push();
    translate(this.x+size/2,this.y+size/2);
    rotate(this.rotation);
    fill(0,255,0,this.alpha);
    rect(-size/2,-size/2,size,size);
    fill(255,0,255,this.alpha);
    textFont("Arial Bold");
    textSize(24);
    textAlign(CENTER,CENTER);
    text(this.value, 0, 0);
    pop();
  }
}


class BlockRow {

  constructor(x, y, numBlocks, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.disabled = false;
    this.blocks = [];
    for (let i = 0; i < numBlocks; i++) {
      //console.log(margin + (this.x+i)*(size+margin*2));
      let block = new Block(margin + (this.x+i)*(size+margin*2), margin + this.y*(size+margin*2), value);
      //console.log(block);
      this.blocks.push(block);
    }
    this.speed = (parseInt((Math.random()*2))*2-1);
    this.vel = (1000/shiftsPerSecond);
    //console.log(this.blocks);
    this.updateLRtask = setInterval(this.updateLR,(1000/shiftsPerSecond),this);
    this.dropTask = setInterval(this.drop,(1000/dropsPerSecond),1,this);
  }

  canLand(base) {
    return (this.x+this.blocks.length > base.x && this.x < base.x+base.blocks.length);
  }

  landOn(base) {
    //console.log("block",x,blocks.length);
    //console.log("base",base.x,base.blocks.length);
    this.disable();
    this.y = base.y - 1;
    this.blocks.forEach( (block) => {
      block.y = margin + this.y*(size+margin*2);
    });
    let lostBlocks = [];
    let leftDiff = base.x - this.x;
    for (let i = 0; i < leftDiff; i++) {
      this.x = base.x;
      lostBlocks.push(this.blocks.splice(0,1)[0]);
    }
    let rightDiff = this.x+this.blocks.length - (base.x+base.blocks.length);
    for (let i = 0; i < rightDiff; i++) {
      lostBlocks.push(this.blocks.splice(this.blocks.length-1,1)[0]);
    }
    return lostBlocks;
  }

  updateLR(self) {
    // if (self.disabled) {
    //     clearInterval(self.updateLRtask);
    //     return;
    // }
    let increment = self.speed;
    if (self.x+self.blocks.length+increment >= canvasWidth) {
      self.speed *= -1;
      increment = canvasWidth-(self.x+self.blocks.length);
    } else if (self.x+increment <= 0) {
      self.speed *= -1;
      increment = -self.x;
    }
    self.x += increment;
    self.blocks.forEach( (block) => {
      block.x += increment*(size+margin*2);
    });
  }

  drop(amount,self) {
    if (self.y == baseBlocks[baseBlocks.length-1].y-2) {
        clearInterval(self.dropTask);
        // if (!self.disabled) {
        // }
    }
    self.y += amount;
    self.blocks.forEach( (block) => {
      block.y = margin + self.y*(size+margin*2);
    });
  }

  draw() {
    //console.log("draw block");
    this.blocks.forEach( (block) => {
      //console.log(block);
      block.draw();
    });
  }

  disable() {
    this.disabled = true;
    clearInterval(this.updateLRtask);
    clearInterval(this.dropTask);
  }

}
