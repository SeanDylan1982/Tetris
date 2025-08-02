  document.addEventListener('DOMContentLoaded', () => {
  // User Authentication System
  const authBtn = document.getElementById("auth-btn");
  const profileBtn = document.getElementById("profile-btn");
  const leaderboardBtn = document.getElementById("leaderboard-btn");
  const loginBtn = document.getElementById("loginBtn");
  const newGameBtn = document.getElementById("new-game-btn");
  const confirmNewGameBtn = document.getElementById("confirmNewGameBtn");
  const newGameModal = new bootstrap.Modal(
    document.getElementById("newGameModal")
  );
  const registerBtn = document.getElementById("registerBtn");
  const showLoginBtn = document.getElementById("showLoginBtn");
  const showRegisterBtn = document.getElementById("showRegisterBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  // Modal elements
  const authModal = new bootstrap.Modal(document.getElementById("authModal"));
  const profileModal = new bootstrap.Modal(
    document.getElementById("profileModal")
  );
  const leaderboardModal = new bootstrap.Modal(
    document.getElementById("leaderboardModal")
  );

  // Form elements
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  // Current user state
  let currentUser = null;

  // Check if user is already logged in
  function checkLoggedInUser() {
    const savedUser = localStorage.getItem("tetrisCurrentUser");
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      updateUIForLoggedInUser();
    }
  }

  // Update UI based on login state
  function updateUIForLoggedInUser() {
    if (currentUser) {
      authBtn.style.display = "none";
      profileBtn.style.display = "inline-block";
      profileBtn.textContent = currentUser.username;
    } else {
      authBtn.style.display = "inline-block";
      profileBtn.style.display = "none";
    }
  }

  // Show auth modal
  authBtn.addEventListener("click", () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    authModal.show();
  });

  // Show profile modal
  profileBtn.addEventListener("click", () => {
    if (currentUser) {
      document.getElementById("profileUsername").textContent =
        currentUser.username;
      document.getElementById("profileHighScore").textContent =
        currentUser.highScore || 0;
      document.getElementById("profileHighLevel").textContent =
        currentUser.highLevel || 1;
      document.getElementById("profileGamesPlayed").textContent =
        currentUser.gamesPlayed || 0;
      profileModal.show();
    }
  });

  // Show leaderboard modal
  leaderboardBtn.addEventListener("click", () => {
    updateLeaderboard();
    leaderboardModal.show();
  });

  // Show New Game confirmation modal
  if (newGameBtn) {
    newGameBtn.addEventListener("click", () => {
      // Only show if a game is potentially in progress
      if (timerId || score > 0) {
        newGameModal.show();
      } else {
        // If no game is running, just start a new one
        startNewGame();
      }
    });
  }

  // Toggle between login and register forms
  showRegisterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "block";
  });

  showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.style.display = "none";
    loginForm.style.display = "block";
  });

  // Handle login
  loginBtn.addEventListener("click", () => {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem("tetrisUsers")) || [];
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      currentUser = user;
      localStorage.setItem("tetrisCurrentUser", JSON.stringify(currentUser));
      updateUIForLoggedInUser();
      authModal.hide();
      alert(`Welcome back, ${username}!`);
    } else {
      alert("Invalid username or password");
    }
  });

  // Handle registration
  registerBtn.addEventListener("click", () => {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const confirmPassword = document
      .getElementById("confirmPassword")
      .value.trim();

    if (!username || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Get existing users
    const users = JSON.parse(localStorage.getItem("tetrisUsers")) || [];

    // Check if username already exists
    if (users.some((u) => u.username === username)) {
      alert("Username already exists");
      return;
    }

    // Create new user
    const newUser = {
      username,
      password,
      highScore: 0,
      highLevel: 1,
      gamesPlayed: 0,
      dateJoined: new Date().toISOString(),
    };

    // Add to users array and save
    users.push(newUser);
    localStorage.setItem("tetrisUsers", JSON.stringify(users));

    // Log in the new user
    currentUser = newUser;
    localStorage.setItem("tetrisCurrentUser", JSON.stringify(currentUser));
    updateUIForLoggedInUser();

    // Hide modal and show success message
    authModal.hide();
    alert(`Welcome, ${username}! Your account has been created.`);
  });

  // Handle logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("tetrisCurrentUser");
    currentUser = null;
    updateUIForLoggedInUser();
    profileModal.hide();
  });

  // Update user stats after game over
  function updateUserStats() {
    if (currentUser) {
      // Get current level and score
      const currentLevel = parseInt(levelDisplay.innerHTML);

      // Update user stats if score is higher than previous high score
      if (score > (currentUser.highScore || 0)) {
        currentUser.highScore = score;
        currentUser.highLevel = currentLevel;
      }

      // Increment games played
      currentUser.gamesPlayed = (currentUser.gamesPlayed || 0) + 1;

      // Save updated user
      localStorage.setItem("tetrisCurrentUser", JSON.stringify(currentUser));

      // Update users array
      const users = JSON.parse(localStorage.getItem("tetrisUsers")) || [];
      const userIndex = users.findIndex(
        (u) => u.username === currentUser.username
      );
      if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem("tetrisUsers", JSON.stringify(users));
      }

      // Update leaderboard
      updateLeaderboard();
    }
  }

  // Update leaderboard
  function updateLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardBody");
    leaderboardBody.innerHTML = "";

    // Get users and sort by high score
    const users = JSON.parse(localStorage.getItem("tetrisUsers")) || [];
    const sortedUsers = [...users].sort(
      (a, b) => (b.highScore || 0) - (a.highScore || 0)
    );

    // Create leaderboard entries
    sortedUsers.slice(0, 10).forEach((user, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.username}</td>
        <td>${user.highScore || 0}</td>
        <td>${user.highLevel || 1}</td>
      `;
      leaderboardBody.appendChild(row);
    });
  }

  // Initialize user system
  checkLoggedInUser();

  // Game variables and elements
  const grid = document.querySelector(".grid");
  let squares = Array.from(document.querySelectorAll(".grid div"));
  const scoreDisplay = document.querySelector("#score");
  const startBtn = document.querySelector("#start-button");
  const width = 10; // Keep width at 10 cells (grid is 10x20)
  let nextRandom = 0;
  let timerId;
  let score = 0;
  let levelDisplay = document.getElementById("level");
  const colors = [
    "#e09119",
    "#79e019",
    "#1976e0",
    "#a119e0",
    "#e0194b",
    "#4bf9ff",
  ];
  // The Tetrominoes Shapes - Corrected Standard Definitions
  const lTetromino = [
    [1, width + 1, width * 2 + 1, 2],
    [width, width + 1, width + 2, width * 2 + 2],
    [1, width + 1, width * 2, width * 2 + 1],
    [width, width * 2, width * 2 + 1, width * 2 + 2],
  ];
  const jTetromino = [
    [0, 1, width + 1, width * 2 + 1],
    [2, width, width + 1, width + 2],
    [1, width + 1, width * 2 + 1, width * 2 + 2],
    [width, width + 1, width + 2, width * 2],
  ];
  const zTetromino = [
    [width, width + 1, width * 2 + 1, width * 2 + 2],
    [1, width, width + 1, width * 2],
    [width, width + 1, width * 2 + 1, width * 2 + 2],
    [1, width, width + 1, width * 2],
  ];
  const sTetromino = [
    [width + 1, width + 2, width * 2, width * 2 + 1],
    [0, width, width + 1, width * 2 + 1],
    [width + 1, width + 2, width * 2, width * 2 + 1],
    [0, width, width + 1, width * 2 + 1],
  ];
  const tTetromino = [
    [1, width, width + 1, width + 2],
    [1, width + 1, width + 2, width * 2 + 1],
    [width, width + 1, width + 2, width * 2 + 1],
    [1, width, width + 1, width * 2 + 1],
  ];
  const oTetromino = [
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
  ];
  const iTetromino = [
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
  ];
  const theTetrominoes = [
    lTetromino,
    jTetromino,
    zTetromino,
    sTetromino,
    tTetromino,
    oTetromino,
    iTetromino,
  ];
  let currentPosition = 0;
  let currentRotation = 0;

  // Audio control system
  const musicBtn = document.getElementById("music-btn");
  const muteBtn = document.getElementById("mute-btn");
  const musicModal = new bootstrap.Modal(document.getElementById("musicModal"));
  const saveMusicSelectionBtn = document.getElementById("saveMusicSelection");
  const musicOptions = document.querySelectorAll('input[name="musicOption"]');
  const playAgainBtn = document.getElementById("play-again-btn");
  const gameOverScreen = document.querySelector(".game-over-screen");
  const finalScoreDisplay = document.getElementById("final-score");
  const finalLevelDisplay = document.getElementById("final-level");

  let gameAudio = new Audio("./audio/03. A-Type Music (Korobeiniki).mp3");
  let selectedMusicPath = "./audio/03. A-Type Music (Korobeiniki).mp3";
  let isMusicPlaying = false;
  let isMuted = false;

  // Set audio to loop
  gameAudio.loop = true;
  gameAudio.volume = 0.5;

  // Preview audio for music selection
  let previewAudio = null;

  // Show music selection modal
  musicBtn.addEventListener("click", () => {
    musicModal.show();
  });

  // Add event listeners to music options for autoplay
  musicOptions.forEach((option) => {
    option.addEventListener("change", () => {
      // Stop any currently playing preview
      if (previewAudio) {
        previewAudio.pause();
        previewAudio = null;
      }

      // Play the selected music as preview
      const musicPath = option.value;
      if (musicPath !== "none") {
        previewAudio = new Audio(musicPath);
        previewAudio.volume = isMuted ? 0 : 0.5;
        previewAudio.play();
      }
    });
  });

  // Handle modal close - stop preview
  document
    .getElementById("musicModal")
    .addEventListener("hidden.bs.modal", () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio = null;
      }
    });

  // Save music selection
  saveMusicSelectionBtn.addEventListener("click", () => {
    const selectedOption = document.querySelector(
      'input[name="musicOption"]:checked'
    );

    // Stop preview audio
    if (previewAudio) {
      previewAudio.pause();
      previewAudio = null;
    }

    if (selectedOption) {
      const newMusicPath = selectedOption.value;

      // If music is currently playing, switch to the new track
      if (isMusicPlaying) {
        gameAudio.pause();

        if (newMusicPath !== "none") {
          gameAudio = new Audio(newMusicPath);
          gameAudio.loop = true;
          gameAudio.volume = isMuted ? 0 : 0.5;
          gameAudio.play();
          selectedMusicPath = newMusicPath;
        } else {
          isMusicPlaying = false;
        }
      } else {
        // Just update the path for next time play is pressed
        if (newMusicPath !== "none") {
          selectedMusicPath = newMusicPath;
        }
      }
    }

    musicModal.hide();
  });

  // Mute/unmute function
  function toggleMute() {
    if (isMuted) {
      if (gameAudio && isMusicPlaying) {
        gameAudio.volume = 0.5;
      }
      isMuted = false;
      muteBtn.innerHTML = '<i class="fa fa-volume-up"></i>';
    } else {
      if (gameAudio) {
        gameAudio.volume = 0;
      }
      isMuted = true;
      muteBtn.innerHTML = '<i class="fa fa-volume-off"></i>';
    }
  }

  // Play music based on game state
  function playGameMusic() {
    if (selectedMusicPath !== "none" && !isMusicPlaying) {
      gameAudio = new Audio(selectedMusicPath);
      gameAudio.loop = true;
      gameAudio.volume = isMuted ? 0 : 0.5;
      gameAudio.play();
      isMusicPlaying = true;
    }
  }

  // Stop music
  function stopGameMusic() {
    if (isMusicPlaying) {
      gameAudio.pause();
      isMusicPlaying = false;
    }
  }

  // Start New Game function
  function startNewGame() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    stopGameMusic();

    // Hide game over screen
    gameOverScreen.style.display = "none";

    // Reset score and level
    score = 0;
    scoreDisplay.innerHTML = "0";
    levelDisplay.innerHTML = "1";

    // Reset the grid to a clean state
    // Clear all existing divs from the grid
    grid.innerHTML = "";
    
    // Recreate the grid structure: 200 empty divs + 10 floor divs
    for (let i = 0; i < 200; i++) {
      grid.appendChild(document.createElement("div"));
    }
    for (let i = 0; i < 10; i++) {
      const floorDiv = document.createElement("div");
      floorDiv.classList.add("taken");
      grid.appendChild(floorDiv);
    }
    
    // Get a fresh, ordered reference to the newly created squares
    squares = Array.from(document.querySelectorAll(".grid div"));

    // Reset game variables
    currentPosition = 4;
    currentRotation = 0;
    random = Math.floor(Math.random() * theTetrominoes.length);
    nextRandom = Math.floor(Math.random() * theTetrominoes.length);
    current = theTetrominoes[random][currentRotation];

    // Update display
    draw();
    displayShape();
    updateGameSpeed();
    playGameMusic();
  }

  // Confirm New Game button listener
  if (confirmNewGameBtn) {
    confirmNewGameBtn.addEventListener("click", () => {
      newGameModal.hide();
      startNewGame();
    });
  }

  // Play Again button event listener
  playAgainBtn.addEventListener("click", () => {
    startNewGame();
  });

  // Add event listener for mute button
  muteBtn.addEventListener("click", toggleMute);
  //  console.log(theTetrominoes[0][0])

  // Randomly select a Tetromino and it's first rotation
  let random = Math.floor(Math.random() * theTetrominoes.length);
  let current = theTetrominoes[random][currentRotation];
  // Draw the selected Tetromino
  function draw() {
    current.forEach((index) => {
      squares[currentPosition + index].classList.add("tetromino");
      squares[currentPosition + index].style.backgroundColor = colors[random];
    });
  }
  // Undraw the Tetromino
  function undraw() {
    current.forEach((index) => {
      squares[currentPosition + index].classList.remove("tetromino");
      squares[currentPosition + index].style.backgroundColor = "";
    });
  }

  // Assign controls to keycodes
  function control(e) {
    if (e.keyCode === 37) {
      moveLeft();
    } else if (e.keyCode === 38) {
      rotate();
    } else if (e.keyCode === 39) {
      moveRight();
    } else if (e.keyCode === 40) {
      moveDown();
    }
  }
  document.addEventListener("keyup", control);

  // Update game speed based on current level
  function updateGameSpeed() {
    // Clear existing interval
    if (timerId) {
      clearInterval(timerId);
    }

    // Get current level
    const currentLevel = parseInt(levelDisplay.innerHTML);

    // Set speed based on level (decreasing time interval as level increases)
    let dropSpeed;
    switch (currentLevel) {
      case 1:
        dropSpeed = 1000;
        break;
      case 2:
        dropSpeed = 900;
        break;
      case 3:
        dropSpeed = 850;
        break;
      case 4:
        dropSpeed = 800;
        break;
      case 5:
        dropSpeed = 750;
        break;
      case 6:
        dropSpeed = 700;
        break;
      case 7:
        dropSpeed = 650;
        break;
      case 8:
        dropSpeed = 600;
        break;
      case 9:
        dropSpeed = 550;
        break;
      case 10:
        dropSpeed = 500;
        break;
      case 11:
        dropSpeed = 400;
        break;
      default:
        dropSpeed = 1000;
    }

    // Start new interval with updated speed
    timerId = setInterval(moveDown, dropSpeed);
  }
  // Move down function
  function moveDown() {
    undraw();
    currentPosition += width;
    draw();
    freeze();
  }
  // Freeze function
  function freeze() {
    if (
      current.some((index) =>
        squares[currentPosition + index + width].classList.contains("taken")
      )
    ) {
      current.forEach((index) =>
        squares[currentPosition + index].classList.add("taken")
      );
      // Apply the level-specific color to the settled blocks
      const currentLevel = parseInt(levelDisplay.innerHTML);
      const levelColor = levelColors[currentLevel - 1] || levelColors[0];

      current.forEach((index) => {
        squares[currentPosition + index].style.backgroundColor = levelColor;
      });

      // Start a new tetromino falling
      random = nextRandom;
      nextRandom = Math.floor(Math.random() * theTetrominoes.length);
      currentRotation = 0; // Reset rotation for the new piece
      current = theTetrominoes[random][currentRotation];
      currentPosition = 4;
      draw();
      displayShape();
      addScore();
      gameOver();
    }
  }

  // Move the Tetromino left, checking for collisions before moving
  function moveLeft() {
    undraw();
    const isAtLeftEdge = current.some(
      (index) => (currentPosition + index) % width === 0
    );

    if (!isAtLeftEdge) {
      const nextPosition = currentPosition - 1;
      const isColliding = current.some((index) =>
        squares[nextPosition + index].classList.contains("taken")
      );
      if (!isColliding) {
        currentPosition = nextPosition;
      }
    }
    draw();
  }

  // Move the Tetromino right, checking for collisions before moving
  function moveRight() {
    undraw();
    const isAtRightEdge = current.some(
      (index) => (currentPosition + index) % width === width - 1
    );

    if (!isAtRightEdge) {
      const nextPosition = currentPosition + 1;
      const isColliding = current.some((index) =>
        squares[nextPosition + index].classList.contains("taken")
      );
      if (!isColliding) {
        currentPosition = nextPosition;
      }
    }
    draw();
  }

  /**
   * Checks if a potential rotation is valid.
   * Prevents pieces from rotating through walls or other pieces.
   * Implements "wall kicks" to allow pieces to rotate when flush against a wall.
   */
  function rotate() {
    undraw();
    const nextRotationIndex = (currentRotation + 1) % current.length;
    const rotatedShape = theTetrominoes[random][nextRotationIndex];

    // A function to check if a given shape at a given position is valid
    const isPositionValid = (pos, shape) => {
      return shape.every((index) => {
        const newIndex = pos + index;
        // Check if it's within the grid and not colliding with a taken piece
        return (
          squares[newIndex] && !squares[newIndex].classList.contains("taken")
        );
      });
    };

    // Check for wrapping issue. This is the most common bug.
    // A piece wraps if a block from one side of the piece ends up on the other side of the board.
    const checkWrap = (pos, shape) => {
      // Get all columns occupied by the shape
      const columns = shape.map((index) => (pos + index) % width);
      const minCol = Math.min(...columns);
      const maxCol = Math.max(...columns);
      // If the distance between the leftmost and rightmost block is too large, it has wrapped.
      return maxCol - minCol < 5;
    };

    // Potential positions to test (current, and wall kicks)
    const kickOffsets = [0, -1, 1, -2, 2];

    for (const offset of kickOffsets) {
      const testPosition = currentPosition + offset;
      if (
        isPositionValid(testPosition, rotatedShape) &&
        checkWrap(testPosition, rotatedShape)
      ) {
        // Found a valid position, apply rotation and new position
        currentPosition = testPosition;
        currentRotation = nextRotationIndex;
        current = rotatedShape;
        draw();
        return; // Exit the function
      }
    }

    // If no valid rotation was found, just redraw the original piece
    draw();
  }

  // Show up-next Tetromino in mini-grid display
  const displaySquares = document.querySelectorAll(".mini-grid div");
  const displayWidth = 4;
  const displayIndex = 0;

  // The Tetrominoes without rotations - Corrected for preview
  const upNextTetrominoes = [
    [1, displayWidth + 1, displayWidth * 2 + 1, 2], // lTetromino
    [0, 1, displayWidth + 1, displayWidth * 2 + 1], // jTetromino
    [
      displayWidth,
      displayWidth + 1,
      displayWidth * 2 + 1,
      displayWidth * 2 + 2,
    ], // zTetromino
    [
      displayWidth + 1,
      displayWidth + 2,
      displayWidth * 2,
      displayWidth * 2 + 1,
    ], // sTetromino
    [1, displayWidth, displayWidth + 1, displayWidth + 2], // tTetromino
    [0, 1, displayWidth, displayWidth + 1], // oTetromino
    [1, displayWidth + 1, displayWidth * 2 + 1, displayWidth * 3 + 1], // iTetromino
  ];
  // Display the up-next shape in the mini-grid display
  function displayShape() {
    // Remove any trace of a tetromino from the entire grid
    displaySquares.forEach((square) => {
      square.classList.remove("tetromino");
      square.style.backgroundColor = "";
    });
    upNextTetrominoes[nextRandom].forEach((index) => {
      displaySquares[displayIndex + index].classList.add("tetromino");
      displaySquares[displayIndex + index].style.backgroundColor =
        colors[nextRandom];
    });
  }
  // Level-based colors for settled blocks
  const levelColors = [
    "#808080", // Level 1 - Gray
    "#4CAF50", // Level 2 - Green
    "#2196F3", // Level 3 - Blue
    "#FF9800", // Level 4 - Orange
    "#9C27B0", // Level 5 - Purple
    "#F44336", // Level 6 - Red
    "#FFEB3B", // Level 7 - Yellow
    "#00BCD4", // Level 8 - Cyan
    "#795548", // Level 9 - Brown
    "#607D8B", // Level 10 - Blue Gray
    "#E91E63", // Level 11 - Pink
  ];

  // Update color of all settled blocks based on level
  function updateSettledBlocksColor(level) {
    // Get the color for the current level (subtract 1 for zero-based array)
    const color = levelColors[level - 1] || levelColors[0];

    // Update all settled blocks to the new color
    squares.forEach((square) => {
      if (
        square.classList.contains("taken") &&
        !square.classList.contains("tetromino")
      ) {
        square.style.backgroundColor = color;
      }
    });
  }

  function addScore() {
    let linesClearedThisTurn = 0;
    
    // Check each row from bottom to top (excluding the bottom floor row)
    for (let row = 18; row >= 0; row--) {
      const rowStartIndex = row * width;
      const rowIndices = [];
      
      // Get all indices for this row
      for (let col = 0; col < width; col++) {
        rowIndices.push(rowStartIndex + col);
      }
      
      // Check if the entire row is filled
      if (rowIndices.every((index) => squares[index].classList.contains("taken"))) {
        linesClearedThisTurn++;
        
        // Remove the completed row
        rowIndices.forEach((index) => {
          squares[index].classList.remove("taken");
          squares[index].classList.remove("tetromino");
          squares[index].style.backgroundColor = "";
        });
        
        // Move all rows above down by one
        for (let moveRow = row; moveRow > 0; moveRow--) {
          for (let col = 0; col < width; col++) {
            const currentIndex = moveRow * width + col;
            const aboveIndex = (moveRow - 1) * width + col;
            
            // Copy the class and style from the row above
            const currentSquare = squares[currentIndex];
            const aboveSquare = squares[aboveIndex];
            
            // Preserve the tetromino class if it exists
            currentSquare.className = aboveSquare.className;
            currentSquare.style.backgroundColor = aboveSquare.style.backgroundColor;
          }
        }
        
        // Clear the top row
        for (let col = 0; col < width; col++) {
          const topIndex = col;
          squares[topIndex].classList.remove("taken");
          squares[topIndex].classList.remove("tetromino");
          squares[topIndex].style.backgroundColor = "";
        }
        
        // Since we cleared a row, we need to check the same row again
        // because rows above have moved down
        row++;
      }
    }
    
    // Update score and level if lines were cleared
    if (linesClearedThisTurn > 0) {
      // Add points based on number of lines cleared (Tetris scoring system)
      const pointsPerLine = [0, 100, 300, 500, 800]; // 0, 1, 2, 3, 4 lines
      score += pointsPerLine[linesClearedThisTurn];
      scoreDisplay.innerHTML = score;
      
      // Update level based on new score
      updateLevel();
    }
  }
  // Update level based on score
  function updateLevel() {
    let newLevel = 1;

    if (score < 10000) {
      newLevel = 1;
    } else if (score >= 10000 && score < 20000) {
      newLevel = 2;
    } else if (score >= 20000 && score < 30000) {
      newLevel = 3;
    } else if (score >= 30000 && score < 40000) {
      newLevel = 4;
    } else if (score >= 40000 && score < 50000) {
      newLevel = 5;
    } else if (score >= 50000 && score < 60000) {
      newLevel = 6;
    } else if (score >= 60000 && score < 70000) {
      newLevel = 7;
    } else if (score >= 70000 && score < 80000) {
      newLevel = 8;
    } else if (score >= 80000 && score < 90000) {
      newLevel = 9;
    } else if (score >= 90000 && score < 100000) {
      newLevel = 10;
    } else if (score >= 110000) {
      newLevel = 11;
    }

    // Only update if level has changed
    if (parseInt(levelDisplay.innerHTML) !== newLevel) {
      levelDisplay.innerHTML = newLevel;
      updateGameSpeed();
      updateSettledBlocksColor(newLevel);
    }
  }
  // Add functionality to the button
  startBtn.addEventListener("click", () => {
    if (timerId) {
      // Pause the game
      clearInterval(timerId);
      timerId = null;
      // Pause music when game is paused
      stopGameMusic();
    } else {
      // Start or resume the game
      draw();
      // Initialize nextRandom if starting a new game
      if (nextRandom === 0 && score === 0) {
        nextRandom = Math.floor(Math.random() * theTetrominoes.length);
      }
      displayShape();
      // Update game speed based on current level
      updateGameSpeed();
      // Start music when game starts
      playGameMusic();
    }
  });

  // Add keyboard controls for start/pause (spacebar, enter, escape)
  document.addEventListener("keydown", (e) => {
    // Only handle these keys if no modal is open and user is logged in
    if (!document.querySelector('.modal[style*="block"]') && currentUser) {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        e.preventDefault(); // Prevent default behavior (like scrolling for spacebar)

        if (timerId) {
          // Pause the game
          clearInterval(timerId);
          timerId = null;
          // Pause music when game is paused
          stopGameMusic();
        } else {
          // Start or resume the game
          draw();
          // Initialize nextRandom if starting a new game
          if (nextRandom === 0 && score === 0) {
            nextRandom = Math.floor(Math.random() * theTetrominoes.length);
          }
          displayShape();
          // Update game speed based on current level
          updateGameSpeed();
          // Start music when game starts
          playGameMusic();
        }
      }
    }
  });

  // Game over!
  function gameOver() {
    if (
      current.some((index) =>
        squares[currentPosition + index].classList.contains("taken")
      )
    ) {
      clearInterval(timerId);

      // Stop game music if playing
      if (isMusicPlaying) {
        gameAudio.pause();
        isMusicPlaying = false;
        musicBtn.innerHTML = '<i class="fa fa-music"></i>';
      }

      // Play game over sound
      const gameOverSound = new Audio("./audio/18. Game Over.mp3");
      gameOverSound.volume = isMuted ? 0 : 0.5;
      gameOverSound.play();

      // Show game over screen
      gameOverScreen.style.display = "flex";
      finalScoreDisplay.textContent = score;
      finalLevelDisplay.textContent = levelDisplay.innerHTML;

      // Update user stats when game is over
      updateUserStats();
    }
  }
})