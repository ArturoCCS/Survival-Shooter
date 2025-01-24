
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let player;
let cursors;
let wasd;
let bullets;
let bala = 20;
let municion;
let score = 0;
let scoreText;
let isGameOver = false;

function preload() {
  this.load.image('player_idle', 'src/assets/sprites/player/player1.png');

  this.load.image('player_walk1Down', 'src/assets/sprites/player/player2.png');
  this.load.image('player_walk2Down', 'src/assets/sprites/player/player3.png');

  this.load.image('player_walk1', 'src/assets/sprites/player/player4.png');
  this.load.image('player_walk2', 'src/assets/sprites/player/player5.png');
  this.load.image('player_walk3', 'src/assets/sprites/player/player6.png');

  this.load.image('player_walk1Up', 'src/assets/sprites/player/player7.png');
  this.load.image('player_walk2Up', 'src/assets/sprites/player/player8.png');
  this.load.image('player_walk3Up', 'src/assets/sprites/player/player9.png');

  this.load.image('bullet', 'src/assets/sprites/bullet/bullet3.png');
  this.load.image('zombie', 'src/assets/sprites/zombie/zombie1.png');
}

function create() {
  // Configurar al jugador

  const controlsText = `
  [ Controles ]
  -----------------------
  Moverse:
    - W/A/S/D o Flechas
  Disparar:
    - Clic izquierdo
  `;
  
    const style = { fontSize: '16px', fill: '#fff', align: 'left', backgroundColor: 'rgba(0, 0, 0, 0.5)' };
    const controlsPanel = this.add.text(10,480, controlsText, style)
      .setScrollFactor(0) // Fijo en pantalla, no se mueve con el jugador
      .setDepth(10);      // Asegura que esté visible por encima de otros elementos

  this.anims.create({
    key: 'walk_down',
    frames: [
      { key: 'player_idle' },
      { key: 'player_walk1Down' },
      { key: 'player_walk2Down' },
    ],
    frameRate: 10, // Velocidad de la animación
    repeat: -1, // Repetir indefinidamente
  });

  this.anims.create({
    key: 'walk_left',
    frames: [
      { key: 'player_walk1' },
      { key: 'player_walk2' },
      { key: 'player_walk3' },
    ],
    frameRate: 10, // Velocidad de la animación
    repeat: -1, // Repetir indefinidamente
  });

  this.anims.create({
    key: 'walk_up',
    frames: [
      { key: 'player_walk1Up' },
      { key: 'player_walk2Up' },
      { key: 'player_walk3Up' },
    ],
    frameRate: 10, // Velocidad de la animación
    repeat: -1, // Repetir indefinidamente
  });

  this.anims.create({
    key: 'walk_right',
    frames: [
      { key: 'player_walk1' },
      { key: 'player_walk2' },
      { key: 'player_walk3' },
    ],
    frameRate: 10, // Velocidad de la animación
    repeat: -1, // Repetir indefinidamente
  });
  
  // Animación para quedarse quieto
  this.anims.create({
    key: 'idle',
    frames: [{ key: 'player_idle' }],
    frameRate: 1,
  });

  // Configurar al jugador
  player = this.physics.add.sprite(400, 300, 'player_idle').setCollideWorldBounds(true);
  player.setScale(4);

  // Configurar las balas
  bullets = this.physics.add.group({
    defaultKey: 'bullet'
  });

  // Grupo de enemigos personalizados
  this.enemigos = this.physics.add.group({
    classType: Enemigo,
    runChildUpdate: true,
  });

  // Controles del jugador
  cursors = this.input.keyboard.createCursorKeys();
  this.input.on('pointerdown', shootBullet, this);
  wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D
  });

  // Texto de puntaje
  scoreText = this.add.text(10, 10, 'Puntaje: 0', { fontSize: '20px', fill: '#fff' });
  municion = this.add.text(500, 10, `Municion: ${bala}`, { fontSize: '20px', fill: '#fff' });

  // Evento para generar enemigos
  this.time.addEvent({
    delay: 2000,
    callback: spawnZombie,
    callbackScope: this,
    loop: true,
  });

  // Colisiones
  this.physics.add.overlap(bullets, this.enemigos, hitZombie, null, this);
  this.physics.add.overlap(player, this.enemigos, gameOver, null, this);
  this.physics.add.overlap(player, this.bala, recogerMuncion, null, this );
}

function update() {
  if (isGameOver) return;

  // Movimiento del jugador
  player.setVelocity(0);
  if (cursors.left.isDown || wasd.left.isDown){
    player.setVelocityX(-200);

    player.setScale(-4, 4); // Invierte la imagen
    player.anims.play('walk_left', true); 
  } else if(cursors.right.isDown || wasd.right.isDown) {
    player.setVelocityX(200);
    
    player.setScale(4, 4); // Invierte la imagen
    player.anims.play('walk_right', true); 
  } else if (cursors.up.isDown || wasd.up.isDown) {
    player.setVelocityY(-200);
    
    player.anims.play('walk_up', true); 
  } else if (cursors.down.isDown || wasd.down.isDown) {
    player.setVelocityY(200);
    
    player.anims.play('walk_down', true); 
  }else{
    player.anims.play('idle', true); 
  }

  this.enemigos.children.iterate((zombie) => {
    if (zombie.active) {
      this.physics.moveToObject(zombie, player, 100); // Velocidad de persecución
    }
  });
}

function shootBullet(pointer) {
  if (isGameOver || bala <= 0) return; // Si se acabó el juego o no hay balas, salir
  bala--;
  municion.setText('Munición: ' + bala);

  const bullet = bullets.get(player.x, player.y);
  if (bullet) {
    bullet.setActive(true);
    bullet.setVisible(true);

    let direction = null;

    // Determinar dirección del disparo
    if (cursors.left.isDown || wasd.left.isDown) {
      direction = 'left';
    } else if (cursors.right.isDown || wasd.right.isDown) {
      direction = 'right';
    } else if (cursors.up.isDown || wasd.up.isDown) {
      direction = 'up';
    } else if (cursors.down.isDown || wasd.down.isDown) {
      direction = 'down';
    }

    switch (direction) {
      case 'left':
        bullet.setVelocityX(-500);
        bullet.setRotation(Math.PI); // Rotar hacia la izquierda
        break;

      case 'right':
        bullet.setVelocityX(500);
        bullet.setRotation(0); // Dirección normal
        break;

      case 'up':
        bullet.setVelocityY(-500);
        bullet.setRotation(-Math.PI / 2); // Rotar hacia arriba
        break;

      case 'down':
        bullet.setVelocityY(500);
        bullet.setRotation(Math.PI / 2); // Rotar hacia abajo
        break;

      default:
        // Si no se presionó dirección, disparar hacia el mouse
        const angle = Phaser.Math.Angle.Between(player.x, player.y, pointer.x, pointer.y);
        const velocity = this.physics.velocityFromRotation(angle, 500);
        bullet.body.velocity.copy(velocity);
        bullet.setRotation(angle);
        break;
    }

    // Desactivar la bala si sale del mundo
    bullet.update = function () {
      if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
        this.setActive(false);
        this.setVisible(false);
      }
    };
  }
}


function spawnZombie() {
  if (isGameOver) return;

  // Elegir una posición aleatoria en los bordes de la pantalla
  let x, y;

  const edge = Phaser.Math.Between(0, 3); // 0: arriba, 1: derecha, 2: abajo, 3: izquierda
  switch (edge) {
    case 0: // Arriba
      x = Phaser.Math.Between(0, 800); // Ancho completo
      y = 0; // En el borde superior
      break;
    case 1: // Derecha
      x = 800; // En el borde derecho
      y = Phaser.Math.Between(0, 600); // Altura completa
      break;
    case 2: // Abajo
      x = Phaser.Math.Between(0, 800); // Ancho completo
      y = 600; // En el borde inferior
      break;
    case 3: // Izquierda
      x = 0; // En el borde izquierdo
      y = Phaser.Math.Between(0, 600); // Altura completa
      break;
  }

  // Crear el nuevo zombi
  const zombie = new Enemigo(this, x, y, 'zombie');
  zombie.setScale(4);

  // Agregar el zombi al grupo
  this.enemigos.add(zombie);


  // Mover al zombi hacia el jugador
  this.physics.moveToObject(zombie, player, 100);

  // Evitar que los zombis se atraviesen entre ellos (colisión)
  this.physics.add.collider(this.enemigos, this.enemigos);
}


function hitZombie(bullet, zombie) {
  // Evitar que la bala colisione nuevamente
  bullet.destroy();

  // Aplicar daño al zombie
  if (!zombie.hasBeenHit) {
    zombie.recibirDaño(1);
    zombie.hasBeenHit = true; // Marcar como "golpeado"
    zombie.setTint(0xff0000);
    this.time.delayedCall(50, () => {
      
      zombie.clearTint(); // Quitar el tinte rojo
      zombie.hasBeenHit = false; // Permitimos que pueda volver a recibir daño
    });
  }

  // Actualizar puntaje si el zombie muere
  if (zombie.vida <= 0) {
    score += 10;
    scoreText.setText('Puntaje: ' + score);
    zombie.dropAmmo(); // Soltar balas cuando el zombie muere
  }
}

function recogerMuncion(player, ammo) {
  bala += 5; // Añadir munición
  municion.setText('Municion: ' + bala); // Actualizar texto de munición
  ammo.destroy(); // Destruir la munición recogida
}

class Enemigo extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    this.vida = 3; // Vida inicial
    this.scene = scene;  // Aseguramos que 'scene' esté correctamente asignada
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  recibirDaño(cantidad) {
    this.vida -= cantidad;
    
    if (this.vida <= 0) {
      this.destruir();
    }
    
  }

  destruir() {
    this.dropAmmo(); // Soltar balas al morir
    this.destroy();
  }

  dropAmmo() {
    // Verificar que 'this.scene' esté disponible
    if (this.scene) {
      // Crear un sprite de munición en la posición del zombie
      const ammo = this.scene.physics.add.sprite(this.x, this.y, 'bullet').setScale(1.5);
      ammo.body.setAllowGravity(false);
  
      // Hacer que las balas sean recogibles por el jugador
      this.scene.physics.add.overlap(player, ammo, recogerMuncion, null, this.scene);
    } 
  }
  
}


function gameOver(player, zombie) {
  isGameOver = true;
  zombie.destroy();
  player.setTint(0xff0000);
  this.physics.pause();
  scoreText.setText('¡Juego Terminado! Puntaje Final: ' + score);
}