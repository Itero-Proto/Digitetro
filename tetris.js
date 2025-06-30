let elapsedTime = 0;
let timerInterval = null;

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y > 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }

    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    rowCount *= 2;
  }
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
        (arena[y + o.y] &&
          arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  if (type === 'T') {
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  } else if (type === 'J') {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ];
  } else if (type === 'I') {
    return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x,
          y + offset.y,
          1, 1);
      }
    });
  });
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}
function playerHardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--; // последний шаг был лишним
  merge(arena, player);
  playerReset();
  arenaSweep();
  updateScore();
  dropCounter = 0;
}


function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  if (collide(arena, player)) {
    // Game Over
    console.log("Telegram WebApp?", typeof Telegram?.WebApp);
    arena.forEach(row => row.fill(0));
    const finalScore = player.score;
    const finalTime = elapsedTime;
    saveHighscore(finalScore, finalTime);

    Telegram.WebApp.sendData(JSON.stringify({

      score: finalScore,
      time: finalTime,
    }));

    player.score = 0;
    updateScore();
    elapsedTime = 0;
    clearInterval(timerInterval);
  } else {
    startTimer(); // начинается новая фигура, таймер идёт
  }
}

function saveHighscore(score, time) {
  const highscores = JSON.parse(localStorage.getItem('highscores') || '[]');
  highscores.push({ score, time });
  highscores.sort((a, b) => b.score - a.score);
  const top10 = highscores.slice(0, 10);
  localStorage.setItem('highscores', JSON.stringify(top10));
}



function startTimer() {
  elapsedTime = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    elapsedTime++;
    document.getElementById('time').innerText = 'Time: ' + elapsedTime + 's';
  }, 1000);
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [
        matrix[x][y],
        matrix[y][x],
      ] = [
          matrix[y][x],
          matrix[x][y],
        ];
    }
  }

  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function updateScore() {
  document.getElementById('score').innerText =
    'Score: ' + player.score;
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}
function showTelegramStatus() {
  const box = document.createElement("div");
  box.style.position = "absolute";
  box.style.top = "10px";
  box.style.left = "10px";
  box.style.padding = "5px 10px";
  box.style.zIndex = "1000";
  box.style.fontFamily = "sans-serif";
  box.style.fontSize = "14px";
  box.style.borderRadius = "6px";
  box.style.backgroundColor = Telegram?.WebApp ? "#0f0" : "#f00";
  box.style.color = "#000";
  box.textContent = Telegram?.WebApp ? "🟢 Telegram подключён" : "🔴 Нет Telegram API";
  document.body.appendChild(box);
}

showTelegramStatus();

document.addEventListener('keydown', event => {
  if (event.keyCode === 37) {
    playerMove(-1);
  } else if (event.keyCode === 39) {
    playerMove(1);
  } else if (event.keyCode === 40) {
    playerDrop();
  } else if (event.keyCode === 32) {
    playerHardDrop(); // пробел
  } else if (event.keyCode === 81) {
    playerRotate(-1);
  } else if (event.keyCode === 87) {
    playerRotate(1);
  }
});

document.getElementById('hardDrop').addEventListener('click', playerHardDrop);

const colors = [
  null,
  '#FF0D72',
  '#0DC2FF',
  '#0DFF72',
  '#F538FF',
  '#FF8E0D',
  '#FFE138',
  '#3877FF',
];

const arena = createMatrix(12, 20);

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

playerReset();
updateScore();
update();

// Touch controls
document.getElementById('left').addEventListener('click', () => playerMove(-1));
document.getElementById('right').addEventListener('click', () => playerMove(1));
document.getElementById('drop').addEventListener('click', playerDrop);
document.getElementById('rotate').addEventListener('click', () => playerRotate(1));
