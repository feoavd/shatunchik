
        const characters = [
            {
                id: 1,
                name: "Группа Демо",
                description: "Зажигаетльая песня, тащите светомузыку!",
                location: {
                    name: "Танцпол",
                    bgImage: "./assets/bg1.webp",
                    groundColor: "#1c3b5a",
                    obstacleColor: "#ff6b6b"
                },
                image: "./assets/demo.png",
                song: "song1"
            },
            {
                id: 2,
                name: "Юрочка Шатунов",
                description: "Вдохновляющая музыка",
                location: {
                    name: "Седая ночь",
                    bgImage: "./assets/bg2.webp",
                    groundColor: "#5a3b1c",
                    obstacleColor: "#8b4513"
                },
                image: "./assets/shat.png",
                song: "song2"
            },
            {
                id: 3,
                name: "Ванесса Мэй",
                description: "Обновленная легендарная песня",
                location: {
                    name: "Полет Шмеля",
                    bgImage: "./assets/bg3.webp",
                    groundColor: "#3b5a1c",
                    obstacleColor: "#8b0000"
                },
                image: "./assets/pchel.png",
                song: "song3"
            },
            {
                id: 4,
                name: "Джо Дассен",
                description: "Французский певец",
                location: {
                    name: "Романтичный городок",
                    bgImage: "./assets/bg4.jpg",
                    groundColor: "#2a5a3b",
                    obstacleColor: "#7209b7"
                },
                image: "./assets/joe.png",
                song: "song4"
            }
        ];

        const selectionScreen = document.getElementById('selectionScreen');
        const gameScreen = document.getElementById('gameScreen');
        const startButton = document.getElementById('startButton');
        const charactersContainer = document.querySelector('.characters-container');
        const player = document.getElementById('player');
        const gameContainer = document.getElementById('gameContainer');
        const scoreValue = document.getElementById('scoreValue');
        const locationDisplay = document.getElementById('locationDisplay');
        const gameOverScreen = document.getElementById('gameOver');
        const finalScore = document.getElementById('finalScore');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const gameOverMessage = document.getElementById('gameOverMessage');
        const restartButton = document.getElementById('restartButton');
        const backToSelection = document.getElementById('backToSelection');
        const pauseButton = document.getElementById('pauseButton');
        const musicButton = document.getElementById('musicButton');
        const muteButton = document.getElementById('muteButton');

        const audioElements = {
            song1: document.getElementById('song1'),
            song2: document.getElementById('song2'),
            song3: document.getElementById('song3'),
            song4: document.getElementById('song4')
        };

        let selectedCharacter = null;
        let gameActive = false;
        let score = 0;
        let obstacles = [];
        let isJumping = false;
        let jumpVelocity = 0;
        let gameSpeed = 5;
        let obstacleInterval;
        let gameLoopId;
        let isPaused = false;
        let isMuted = false;
        let musicEnabled = true;
        let currentAudio = null;
        let isOnObstacle = false;
        let currentObstacle = null;
        let maxObstacles = 22;
        let obstaclesGenerated = 0;
        let isGameOverScreenShown = false;

        function createCharacterCards() {
            charactersContainer.innerHTML = '';
            
            characters.forEach(character => {
                const card = document.createElement('div');
                card.className = 'character-card';
                card.dataset.id = character.id;
                
                card.innerHTML = `
                    <div class="character-img">
                        <img src="${character.image}" alt="${character.name}">
                    </div>
                    <div class="character-name">${character.name}</div>
                    <div class="character-desc">${character.description}</div>
                    <div class="location-info">
                        Локация: <span class="location-name">${character.location.name}</span>
                    </div>
                `;
                
                card.addEventListener('click', () => selectCharacter(character));
                charactersContainer.appendChild(card);
            });
        }

        function selectCharacter(character) {
            selectedCharacter = character;
            
            document.querySelectorAll('.character-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            document.querySelector(`.character-card[data-id="${character.id}"]`).classList.add('selected');
            
            startButton.disabled = false;
        }

        function playMusic() {
            if (!musicEnabled || !selectedCharacter) return;
            
            stopMusic();
            
            currentAudio = audioElements[selectedCharacter.song];
            if (currentAudio) {
                currentAudio.currentTime = 0;
                currentAudio.muted = isMuted;
                currentAudio.volume = 0.7;
                currentAudio.play().catch(e => console.log("Автовоспроизведение заблокировано"));
            }
        }

        function stopMusic() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
        }

        function startGame() {
            if (!selectedCharacter) return;
            
            selectionScreen.style.display = 'none';
            gameScreen.style.display = 'flex';
            
            player.innerHTML = `<img src="${selectedCharacter.image}" alt="Player" style="width: 120px; height: 120px;">`;
            
            gameContainer.style.backgroundImage = `url('${selectedCharacter.location.bgImage}')`;
            gameContainer.style.backgroundSize = 'cover';
            gameContainer.style.backgroundPosition = 'center';
            
            document.querySelector('.ground').style.backgroundColor = selectedCharacter.location.groundColor;
            
            locationDisplay.textContent = `Локация: ${selectedCharacter.location.name}`;
            
            resetGame();
            
            playMusic();
            
            gameActive = true;
            gameLoopId = requestAnimationFrame(gameLoop);
            
            startObstacleGeneration();
        }

        function resetGame() {
            score = 0;
            scoreValue.textContent = score;
            obstacles = [];
            obstaclesGenerated = 0;
            isJumping = false;
            jumpVelocity = 0;
            gameSpeed = 5;
            isPaused = false;
            isOnObstacle = false;
            currentObstacle = null;
            isGameOverScreenShown = false;
            pauseButton.textContent = "Пауза";
            
            document.querySelectorAll('.obstacle').forEach(obs => obs.remove());
            
            player.style.bottom = '40px';
            
            gameOverScreen.style.display = 'none';
        }

        function startObstacleGeneration() {
            if (obstacleInterval) clearInterval(obstacleInterval);
            
            obstacleInterval = setInterval(() => {
                if (!gameActive || isPaused) return;
                
                if (obstaclesGenerated >= maxObstacles) { 
                    stopObstacleGeneration();
                    endGameWithWin();
                    return;
                }
                
                createObstacle();
            }, 2000);
        }

        function stopObstacleGeneration() {
            if (obstacleInterval) {
                clearInterval(obstacleInterval);
                obstacleInterval = null;
            }
        }

        function createObstacle() {
            const obstacle = document.createElement('div');
            obstacle.className = 'obstacle';
            obstacle.style.left = '100%';
            obstacle.style.backgroundColor = selectedCharacter.location.obstacleColor;
            
            const height = Math.floor(Math.random() * 60) + 40;
            obstacle.style.height = `${height}px`;
            obstacle.style.width = '50px';
            obstacle.style.bottom = '40px';
            
            obstacle.style.borderTopLeftRadius = '10px';
            obstacle.style.borderTopRightRadius = '10px';
            
            gameContainer.appendChild(obstacle);
            
            const obstacleObj = {
                element: obstacle,
                x: gameContainer.clientWidth,
                height: height,
                passed: false,
                width: 50
            };
            
            obstacles.push(obstacleObj);
            obstaclesGenerated++;
            
            return obstacleObj;
        }

        function gameLoop() {
            if (!gameActive || isPaused) return;
            
            updateObstacles();
            
            updateJump();
            
            checkCollisions();
            
            if (score > 0 && score % 10 === 0) {
                gameSpeed = 5 + Math.floor(score / 10);
                
                if (obstacleInterval) {
                    clearInterval(obstacleInterval);
                    const interval = Math.max(800, 2000 - (score * 40));
                    obstacleInterval = setInterval(() => {
                        if (!gameActive || isPaused) return;
                        if (obstaclesGenerated < maxObstacles) {
                            createObstacle();
                        } else {
                            stopObstacleGeneration();
                            endGameWithWin();
                        }
                    }, interval);
                }
            }
            
            gameLoopId = requestAnimationFrame(gameLoop);
        }

        function updateObstacles() {
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obs = obstacles[i];
                
                obs.x -= gameSpeed;
                obs.element.style.left = `${obs.x}px`;
                
                if (obs.x < -100) {
                    obs.element.remove();
                    obstacles.splice(i, 1);
                    
                    if (currentObstacle === obs) {
                        isOnObstacle = false;
                        currentObstacle = null;
                        isJumping = true;
                        jumpVelocity = 0;
                    }
                }
                
                if (!obs.passed && obs.x < 150) {
                    obs.passed = true;
                    score++;
                    scoreValue.textContent = score;
                }
            }
        }

        function updateJump() {
            if (isJumping) {
                let currentBottom = parseInt(player.style.bottom);
                currentBottom += jumpVelocity;
                
                jumpVelocity -= 0.5;
                
                if (currentBottom <= 40) {
                    currentBottom = 40;
                    isJumping = false;
                    jumpVelocity = 0;
                    isOnObstacle = false;
                    currentObstacle = null;
                }
                
                player.style.bottom = `${currentBottom}px`;
            }
        }

        function checkCollisions() {
            const playerRect = player.getBoundingClientRect();
            
            for (const obs of obstacles) {
                const obsRect = obs.element.getBoundingClientRect();
                
                const playerBottom = playerRect.bottom;
                const obstacleTop = obsRect.top;
                const isAboveObstacle = playerBottom <= obstacleTop + 20;
                const isWithinWidth = playerRect.right > obsRect.left + 15 && 
                                    playerRect.left < obsRect.right - 15;
                
                if (isWithinWidth && isAboveObstacle && !isJumping && jumpVelocity <= 0) {
                    if (playerBottom >= obstacleTop - 10) {
                        isOnObstacle = true;
                        currentObstacle = obs;
                        
                        const obstacleTopPosition = obsRect.top - gameContainer.getBoundingClientRect().top;
                        player.style.bottom = `${obstacleTopPosition + 40}px`;
                        
                        return;
                    }
                }
                
                if (currentObstacle === obs && !isWithinWidth && isOnObstacle) {
                    isOnObstacle = false;
                    currentObstacle = null;
                    isJumping = true;
                    jumpVelocity = 0;
                }
                
                const isSideCollision = !isAboveObstacle &&
                                      playerRect.left < obsRect.right &&
                                      playerRect.right > obsRect.left &&
                                      playerRect.top < obsRect.bottom &&
                                      playerRect.bottom > obsRect.top;
                
                if (isSideCollision) {
                    endGame();
                    return;
                }
            }
        }

        function jump() {
            if (!gameActive || isPaused || isGameOverScreenShown) return;
            
            if (!isJumping || isOnObstacle) {
                isJumping = true;
                jumpVelocity = 22;
                isOnObstacle = false;
                currentObstacle = null;
            }
        }

        function endGame() {
            gameActive = false;
            stopObstacleGeneration();
            cancelAnimationFrame(gameLoopId);
            
            stopMusic();
            
            finalScore.textContent = score;
            gameOverTitle.textContent = "ИГРА ОКОНЧЕНА!";
            gameOverMessage.textContent = `Ваш счет: ${score}`;
            
            gameOverScreen.style.padding = "50px";
            gameOverScreen.style.minWidth = "400px";
            
            gameOverScreen.style.display = 'flex';
            isGameOverScreenShown = true;
        }

        function endGameWithWin() {
            gameActive = false;
            stopObstacleGeneration();
            cancelAnimationFrame(gameLoopId);
            
            stopMusic();
            
            finalScore.textContent = score;
            gameOverTitle.textContent = "ПОБЕДА!";
            gameOverMessage.innerHTML = `Вы прошли все необходимые препятствия!<br><br><strong>Финальный счет: ${score}</strong>`;
            
            gameOverScreen.style.padding = "80px 60px";
            gameOverScreen.style.minWidth = "600px";
            gameOverScreen.style.fontSize = "1.2rem";
            
            gameOverScreen.style.display = 'flex';
            isGameOverScreenShown = true;
        }

        function togglePause() {
            if (!gameActive || isGameOverScreenShown) return;
            
            isPaused = !isPaused;
            pauseButton.textContent = isPaused ? "Продолжить" : "Пауза";
            
            if (isPaused) {
                if (currentAudio) currentAudio.pause();
            } else {
                if (currentAudio && musicEnabled) currentAudio.play();
            }
            
            if (!isPaused) {
                gameLoopId = requestAnimationFrame(gameLoop);
            }
        }

        function toggleMusic() {
            musicEnabled = !musicEnabled;
            musicButton.textContent = `Музыка: ${musicEnabled ? 'Вкл' : 'Выкл'}`;
            
            if (musicEnabled && gameActive && !isPaused) {
                playMusic();
            } else {
                stopMusic();
            }
        }

        function toggleMute() {
            isMuted = !isMuted;
            muteButton.textContent = isMuted ? "" : "";
            
            if (currentAudio) {
                currentAudio.muted = isMuted;
            }
        }

        function returnToSelection() {
            gameActive = false;
            stopObstacleGeneration();
            cancelAnimationFrame(gameLoopId);
            
            stopMusic();
            
            gameScreen.style.display = 'none';
            selectionScreen.style.display = 'flex';
            isGameOverScreenShown = false;
        }

        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', () => {
            resetGame();
            gameActive = true;
            playMusic();
            gameLoopId = requestAnimationFrame(gameLoop);
            startObstacleGeneration();
            gameOverScreen.style.display = 'none';
            isGameOverScreenShown = false;
        });
        backToSelection.addEventListener('click', returnToSelection);
        pauseButton.addEventListener('click', togglePause);
        musicButton.addEventListener('click', toggleMusic);
        muteButton.addEventListener('click', toggleMute);

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (!isGameOverScreenShown) {
                    if (!gameActive) {
                        if (gameOverScreen.style.display !== 'flex' && selectionScreen.style.display !== 'none') {
                            if (selectedCharacter) startGame();
                        }
                    } else {
                        jump();
                    }
                    e.preventDefault();
                }
            }
            
            if (e.code === 'KeyP' && gameActive && !isGameOverScreenShown) {
                togglePause();
            }
            
            if (e.code === 'KeyM' && gameActive) {
                toggleMusic();
            }
        });

        gameContainer.addEventListener('click', () => {
            if (gameActive && !isGameOverScreenShown) jump();
        });

        function preloadImages() {
            characters.forEach(character => {
                const img = new Image();
                img.src = character.image;
                
                const bg = new Image();
                bg.src = character.location.bgImage;
            });
        }

        createCharacterCards();
        preloadImages();
        
        setTimeout(() => {
            selectCharacter(characters[0]);
        }, 100);