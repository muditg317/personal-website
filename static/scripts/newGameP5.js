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


  setupGame();
  lose();

}

function setupGame() {

}


function draw() {
  drawBackground();
}

const drawBackground = () => {

};


function keyPressed(e) {
    if (key == '1' && !gameStarted) {
        e.preventDefault();
        handleEvent();
    }
    if (key == ' ' && gameStarted) {
        e.preventDefault();
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
