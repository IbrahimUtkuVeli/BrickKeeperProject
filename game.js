// 1.  SABİTLER
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const PADDLE_MARGIN_BOTTOM = 50;
const BALL_RADIUS = 10;

// --- ZAMAN VE DURUM DEĞİŞKENLERİ ---
let gameTime = 120; 
let lastTime = Date.now();
let GAME_OVER = false;
let GAME_WON = false;
let finalScore = 0;
let remainingTimeDisplay = 0;

// --- KALKAN AYARLARI ---
const MAX_SHIELDS = 2;         // Aynı anda korunabilcek blok sayısı
let activeShields = 0;         // Aktif korunan blok
const SHIELD_DURATION = 2000;  // Koruma süresi: 2 saniye

// --- BOMBA AYARLARI ---
const BOMB_DURATION = 3000;   // Bombanın patlama süresi: 3 saniye

// --- MAVİ BLOK VE KALKAN AYARLARI ---
const BLUE_DURATION = 4000;       // Mavi bloğun ekranda kalma süresi: 4 saniye
const GLOBAL_SHIELD_TIME = 10000; // Küresel kalkanın aktif kalma süresi: 10 saniye

// --- ONARICI BLOK AYARLARI ---
const GREEN_DURATION = 4000;      // Yeşil bloğun ekranda kalma süresi: 4 saniye

// --- ÜRETİM AYARLARI ---
let specialBlockTimer; // Tek merkezden kontrol için

// --- SES AYARLARI ---
const BG_MUSIC = new Audio("Assets/bg.mp3"); 
BG_MUSIC.loop = true;  
BG_MUSIC.volume = 0.1; 

const HIT_SOUND = new Audio("Assets/wall_hit.mp3"); 
HIT_SOUND.volume = 0.5; 

let globalShieldEndTime = 0;      // Küresel kalkanın bitiş zamanı 
let blueCombo = 0;                // Tıklanan mavi blok sayısı

// --- BLOK GÖRSELLERİNİ YÜKLEME ---
const imgNormal = new Image();
imgNormal.src = "Assets/normal_blok.png"; // Normal tuğla görseli

const imgBlue = new Image();
imgBlue.src = "Assets/mavi_blok.png";     // Mavi güçlendirici görseli

const imgBomb = new Image();
imgBomb.src = "Assets/kirmizi_bomba.png"; // Bomba tuğla görseli

const imgGreen = new Image();
imgGreen.src = "Assets/yesil_tamir.png";  // Yeşil tamir görseli

const imgShield = new Image();
imgShield.src = "Assets/kalkanli_blok.png"; // Kalkanla korunan tuğla görseli

const canvas = document.getElementById("breakout");
const ctx = canvas.getContext("2d");

// Çerçeve ekleme 
canvas.style.border = "1px solid #0ff";

// RAKET OBJESİ
const paddle = {
    x : canvas.width/2 - PADDLE_WIDTH/2,
    y : canvas.height - PADDLE_MARGIN_BOTTOM - PADDLE_HEIGHT,
    width : PADDLE_WIDTH,
    height : PADDLE_HEIGHT,
    dx : 5
}

// TOP OBJESİ 
const ball = {
    x : canvas.width/2,
    y : paddle.y - BALL_RADIUS,
    radius : BALL_RADIUS,
    speed : 2, 
    dx : 2 * (Math.random() * 2 - 1), 
    dy : -2 
}

// RAKETİ ÇİZİMİ
function drawPaddle(){
    ctx.fillStyle = "#2e3548";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    ctx.strokeStyle = "#ffcd05";
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

// TOPU ÇİZİMİ
function drawBall(){
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = "#ffcd05";
    ctx.fill();
    ctx.strokeStyle = "#2e3548";
    ctx.stroke();
    ctx.closePath();
}

function checkGameStatus() {
    let activeBricks = 0;
    
    // Kalan aktif tuğlaları sayMA
    for(let r = 0; r < brick.row; r++) {
        for(let c = 0; c < brick.column; c++) {
            if(bricks[r][c].status) {
                activeBricks++;
            }
        }
    }

    // KAZANMA DURUMU:
    if (gameTime <= 0 && activeBricks > 0 && !GAME_OVER) {
        GAME_WON = true;
        finalScore = activeBricks * 10; 
    }

    // KAYBETME DURUMU
    if (activeBricks === 0 && !GAME_WON) {
        GAME_OVER = true;
        remainingTimeDisplay = Math.max(0, gameTime); 
    }
}

function drawUI() {
    // Süreyi gösterme
    ctx.fillStyle = "#FFF";
    ctx.font = "20px Arial";
    ctx.fillText("Süre: " + Math.max(0, gameTime) + "s", canvas.width - 120, 30);

    // KAZANMA EKRANI
    if (GAME_WON) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; -
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#0ff"; 
        ctx.font = "40px Arial";
        ctx.fillText("KAZANDIN!", canvas.width / 2 - 105, canvas.height / 2 - 40);

        ctx.fillStyle = "#FFF";
        ctx.font = "20px Arial";
        ctx.fillText("Skor: " + finalScore, canvas.width / 2 - 40, canvas.height / 2);
        ctx.fillText("Tekrar oynamak için tıkla", canvas.width / 2 - 110, canvas.height / 2 + 40);
    }

    // KAYBETME EKRANI
    if (GAME_OVER) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FF0000"; 
        ctx.font = "40px Arial";
        ctx.fillText("OYUN BİTTİ!", canvas.width / 2 - 115, canvas.height / 2 - 40);

        ctx.fillStyle = "#FFF";
        ctx.font = "20px Arial";
        ctx.fillText("Kalan Süre: " + remainingTimeDisplay + "s", canvas.width / 2 - 65, canvas.height / 2);
        ctx.fillText("Tekrar oynamak için tıkla", canvas.width / 2 - 110, canvas.height / 2 + 40);
    }
}

// TAKİP VE HAREKET MANTIĞI
function moveBall(){
    ball.x += ball.dx;
    ball.y += ball.dy;

    // RAKETİN TOPU X EKSENİNDE TAKİP ETMESİ
    paddle.x = ball.x - paddle.width / 2;

    if(paddle.x < 0) {
        paddle.x = 0;
    } else if(paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// DUVAR ÇARPIŞMALARI
function ballWallCollision(){
    if(ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0){
        ball.dx = -ball.dx;
        HIT_SOUND.play();
    }
    
    if(ball.y - ball.radius < 0){
        ball.dy = -ball.dy;
        HIT_SOUND.play();
        ball.dx += (Math.random() * 2 - 1) * 0.5; 
    }
    
    if(ball.y + ball.radius > canvas.height){
        resetBall();
    }
}

function resetBall(){
    ball.x = canvas.width / 2;
    ball.y = paddle.y - BALL_RADIUS;
    ball.speed = 3;
    
    ball.dx = 2 * (Math.random() * 2 - 1); 
    if(Math.abs(ball.dx) < 0.5) ball.dx = 1; 
    
    ball.dy = -2; 
}

// RAKET ÇARPIŞMASI
function ballPaddleCollision(){
    if(ball.x < paddle.x + paddle.width && 
       ball.x > paddle.x && 
       ball.y < paddle.y + paddle.height && 
       ball.y + ball.radius > paddle.y){
        
        if(ball.dy > 0){
            ball.dy = -ball.dy;
            HIT_SOUND.play();
            
            if(Math.abs(ball.dx) < 1.5){
                ball.dx = ball.dx > 0 ? 2 : -2; 
            }
        }
    }
}

// --- TUĞLA AYARLARI ---
const brick = {
    row : 4,        
    column : 5,     
    width : 70,     
    height : 25,    
    marginTop : 150, 
    padding: 8,     
    fillColor : "#D35400", 
    strokeColor : "#5C2E0E"   
}

let bricks = [];

// TUĞLALARI OLUŞTURMA 
function createBricks(){
    const totalBrickWidth = brick.width + brick.padding;
    const gridWidth = (brick.column * totalBrickWidth) - brick.padding; 
    
    const startX = (canvas.width - gridWidth) / 2;

    for(let r = 0; r < brick.row; r++){
        bricks[r] = [];
        for(let c = 0; c < brick.column; c++){
            bricks[r][c] = {
                x : startX + (c * totalBrickWidth), 
                y : brick.marginTop + (r * (brick.height + brick.padding)), 
                status : true,
                isProtected: false 
            }
        }
    }
}

// Oyunu başlatırken tuğlaları oluşturuyoruz
createBricks();

// TUĞLALARI ÇİZME 
function drawBricks(){
    let isGlobalShieldActive = Date.now() < globalShieldEndTime;

    for(let r = 0; r < brick.row; r++){
        for(let c = 0; c < brick.column; c++){
            let b = bricks[r][c];
            if(b.status){
                
                // 1. MAVİ BLOK  DURUMU
                if (b.isBlue) {
                    ctx.drawImage(imgBlue, b.x, b.y, brick.width, brick.height);
                    
                    let elapsed = Date.now() - b.blueStartTime;
                    let remainingRatio = Math.max(0, 1 - (elapsed / BLUE_DURATION));
                    
                    // Süre barı
                    ctx.fillStyle = "#333";
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width, 5); 
                    ctx.fillStyle = "#FFF"; 
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width * remainingRatio, 5);
                }
                // 2. KÜRESEL KALKAN AKTİFSE TÜM TUĞLALARI KORU 
                else if (isGlobalShieldActive && !b.isBomb) {
                    ctx.drawImage(imgShield, b.x, b.y, brick.width, brick.height);
                    ctx.fillStyle = "rgba(52, 152, 219, 0.4)"; 
                    ctx.fillRect(b.x, b.y, brick.width, brick.height);
                }
                // 3. BOMBA DURUMU
                else if (b.isBomb) {
                    ctx.drawImage(imgBomb, b.x, b.y, brick.width, brick.height);
                    
                    let elapsed = Date.now() - b.bombStartTime;
                    let remainingRatio = Math.max(0, 1 - (elapsed / BOMB_DURATION));
                    
                    ctx.fillStyle = "#333";
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width, 5); 
                    ctx.fillStyle = "#F1C40F"; 
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width * remainingRatio, 5);
                } 
                // 4. YEŞİL BLOK DURUMU
                else if (b.isGreen) {
                    ctx.drawImage(imgGreen, b.x, b.y, brick.width, brick.height);
                    
                    let elapsed = Date.now() - b.greenStartTime;
                    let remainingRatio = Math.max(0, 1 - (elapsed / GREEN_DURATION));
                    
                    ctx.fillStyle = "#333";
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width, 5); 
                    ctx.fillStyle = "#FFF"; 
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width * remainingRatio, 5);
                }
                // 5. NORMAL KALKAN DURUMU 
                else if (b.isProtected) {
                    ctx.drawImage(imgShield, b.x, b.y, brick.width, brick.height);
                    
                    let elapsed = Date.now() - b.shieldStartTime;
                    let remainingRatio = Math.max(0, 1 - (elapsed / SHIELD_DURATION));
                    
                    ctx.fillStyle = "#333";
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width, 5); 
                    ctx.fillStyle = "#00FFCC";
                    ctx.fillRect(b.x, b.y + brick.height - 5, brick.width * remainingRatio, 5);
                } 
                // 6. NORMAL TUĞLA
                else {
                    ctx.drawImage(imgNormal, b.x, b.y, brick.width, brick.height);
                }
            }
        }
    }
}

// TOP VE TUĞLA ÇARPIŞMASI 
function ballBrickCollision(){
    let isGlobalShieldActive = Date.now() < globalShieldEndTime;

    for(let r = 0; r < brick.row; r++){
        for(let c = 0; c < brick.column; c++){
            let b = bricks[r][c];
            if(b.status){
                // Çarpışma Kontrolü
                if(ball.x + ball.radius > b.x && 
                   ball.x - ball.radius < b.x + brick.width && 
                   ball.y + ball.radius > b.y && 
                   ball.y - ball.radius < b.y + brick.height){

                    HIT_SOUND.play();

                    if ((ball.dy < 0 && ball.y > b.y + brick.height/2) || 
                        (ball.dy > 0 && ball.y < b.y + brick.height/2)) {
                        ball.dy = -ball.dy; 
                    } else {
                        ball.dx = -ball.dx; // Yan taraflardan çarpmışsa yatayda sektir
                    }
                    
                    // Sadece eğer tuğla kalkanlı DEĞİLSE ve KÜRESEL KALKAN yoksa tuğlayı kır
                    if(!b.isProtected && !isGlobalShieldActive){
                        b.status = false;   
                    }
                    
                    return; 
                }
            }
        }
    }
}

// FARE TIKLAMASINI 
canvas.addEventListener("click", function(event) {
    if (BG_MUSIC.paused) {
        BG_MUSIC.play().catch(e => console.error("Müzik başlatılamadı:", e));   
    }
    // OYUN BİTTİYSE YENİDEN BAŞLAT
    if (GAME_OVER || GAME_WON) {
        GAME_OVER = false;
        GAME_WON = false;
        gameTime = 120; 
        lastTime = Date.now();
        createBricks(); // Tuğlaları yeniden diz
        resetBall();    // Topu merkeze al
        loop();         // Döngüyü tekrar ateşle
        return;     
    }
    let rect = canvas.getBoundingClientRect();
    let mouseX = event.clientX - rect.left;
    let mouseY = event.clientY - rect.top;

    let clickedOnBlueBrick = false; 

    for (let r = 0; r < brick.row; r++) {
        for (let c = 0; c < brick.column; c++) {
            let b = bricks[r][c];
            
            if (b.status) {
                if (mouseX > b.x && mouseX < b.x + brick.width && mouseY > b.y && mouseY < b.y + brick.height) {
                    
                    // DURUM 0: MAVİ BLOK ETKİLEŞİMİ 
                    if (b.isBlue) {
                        b.isBlue = false; 
                        blueCombo++; 
    
                        if (blueCombo >= 3) {
                            blueCombo = 0; 
                            globalShieldEndTime = Date.now() + GLOBAL_SHIELD_TIME; 
                        }
                        return;
                    }
                    // DURUM 1: BOMBA ETKİLEŞİMİ
                    else if (b.isBomb) {
                        b.isBomb = false; 
                        return; 
                    } 
                    // ---YEŞİL BLOK ETKİLEŞİMİ ---
                    else if (b.isGreen) {
                        b.isGreen = false; // Tıklandığında normale döner
                        repairRandomBrick(); // Rastgele bir kırık tuğlayı tamir eder
                        return;
                    }
                    // DURUM 2: NORMAL KALKAN
                    else if (!b.isProtected && activeShields < MAX_SHIELDS) {
                        b.isProtected = true;
                        b.shieldStartTime = Date.now(); 
                        activeShields++; 
                        setTimeout(() => {
                            b.isProtected = false;
                            activeShields--; 
                        }, SHIELD_DURATION);
                        return;
                    }
                }
            }
        }
    }
});

// BOMBA ÜRETİCİ
function spawnBomb() {
    let availableBricks = [];
    
    for (let r = 0; r < brick.row; r++) {
        for (let c = 0; c < brick.column; c++) {
            let b = bricks[r][c];
            if (b.status && !b.isProtected && !b.isBomb && !b.isBlue) {
                availableBricks.push(b);
            }
        }
    }
    
    if (availableBricks.length > 0) {
        let randomIndex = Math.floor(Math.random() * availableBricks.length);
        let selectedBrick = availableBricks[randomIndex];
        
        selectedBrick.isBomb = true;
        selectedBrick.bombStartTime = Date.now();
    }
}

// MAVİ BLOK ÜRETİCİ
function spawnBlueBlock() {
    let availableBricks = [];
    
    for (let r = 0; r < brick.row; r++) {
        for (let c = 0; c < brick.column; c++) {
            let b = bricks[r][c];
            if (b.status && !b.isProtected && !b.isBomb && !b.isBlue) {
                availableBricks.push(b);
            }
        }
    }
    
    if (availableBricks.length > 0) {
        let randomIndex = Math.floor(Math.random() * availableBricks.length);
        let selectedBrick = availableBricks[randomIndex];
        
        selectedBrick.isBlue = true;
        selectedBrick.blueStartTime = Date.now();
    }
}

// ONARICI BLOK ÜRETİCİ
function spawnGreenBlock() {
    let availableBricks = [];
    for (let r = 0; r < brick.row; r++) {
        for (let c = 0; c < brick.column; c++) {
            let b = bricks[r][c];
            if (b.status && !b.isProtected && !b.isBomb && !b.isBlue && !b.isGreen) {
                availableBricks.push(b);
            }
        }
    }
    
    if (availableBricks.length > 0) {
        let randomIndex = Math.floor(Math.random() * availableBricks.length);
        let selectedBrick = availableBricks[randomIndex];
        selectedBrick.isGreen = true;
        selectedBrick.greenStartTime = Date.now();
    }
}

function startSpecialBlockSpawner() {
    let randomDelay = Math.floor(Math.random() * 4000) + 3000;

    specialBlockTimer = setTimeout(() => {
        // Ekranda halihazırda özel bir blok var mı kontrol et 
        let specialExists = false;
        for(let r=0; r<brick.row; r++){
            for(let c=0; c<brick.column; c++){
                if(bricks[r][c].isBomb || bricks[r][c].isBlue || bricks[r][c].isGreen) {
                    specialExists = true;
                }
            }
        }

        // Eğer ekranda özel blok yoksa, rastgele birini seç ve üret
        if (!specialExists) {
            let rand = Math.random();
            if (rand < 0.33) spawnBomb();
            else if (rand < 0.66) spawnBlueBlock();
            else spawnGreenBlock();
        }

        // Bir sonraki bloğu planla 
        startSpecialBlockSpawner();
    }, randomDelay);
}
startSpecialBlockSpawner();

// RASTGELE BİR BLOĞU TAMİR ETME
function repairRandomBrick() {
    let broken = [];
    for(let r=0; r<brick.row; r++) {
        for(let c=0; c<brick.column; c++) { 
            if(!bricks[r][c].status) {
                broken.push(bricks[r][c]); 
            }
        }
    }
    // Eğer kırık tuğla varsa rastgele birini seç ve düzelt
    if(broken.length > 0) {
        let randomIndex = Math.floor(Math.random() * broken.length);
        broken[randomIndex].status = true;
    }
}

// ZAMANLI OLAYLARIN KONTROLÜ
function checkTimers() {
    for (let r = 0; r < brick.row; r++) {
        for (let c = 0; c < brick.column; c++) {
            let b = bricks[r][c];
            if (b.status) {
                // Bomba Süresi Bitti mi
                if (b.isBomb && (Date.now() - b.bombStartTime >= BOMB_DURATION)) {
                    b.status = false; 
                    b.isBomb = false; 
                }
                // Mavi Blok Süresi Bitti mi
                if (b.isBlue && (Date.now() - b.blueStartTime >= BLUE_DURATION)) {
                    b.isBlue = false; 
                    blueCombo = 0; 
                }
                // ---Yeşil Blok Süresi Bitti mi---
                if (b.isGreen && (Date.now() - b.greenStartTime >= GREEN_DURATION)) {
                    b.isGreen = false; 
                }
            }
        }
    }
}

// --- ANA OYUN DÖNGÜSÜ ---
function loop() {
    // Eğer oyun bittiyse sadece UI çiz ve döngüyü durdur 
    if (GAME_OVER || GAME_WON) {
        drawUI();
        return; 
    }

    let now = Date.now();
    if (now - lastTime >= 1000) {
        gameTime--;
        lastTime = now;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    checkTimers();
    drawPaddle();
    drawBall();
    drawBricks();

    moveBall();
    ballWallCollision();
    ballPaddleCollision();
    ballBrickCollision();
    checkGameStatus();
    drawUI();
    requestAnimationFrame(loop);
}
startSpecialBlockSpawner();
loop();