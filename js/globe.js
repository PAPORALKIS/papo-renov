import * as THREE from 'three';

// Initialisation
const container = document.getElementById("globe-container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight - 60);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lumière et logo
scene.add(new THREE.AmbientLight(0xffffff));
const logoTexture = new THREE.TextureLoader().load("img/logo.png");
const logoSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: logoTexture }));
logoSprite.scale.set(1.5, 1.5, 1);
scene.add(logoSprite);

camera.position.z = 6;

// Utilitaire de création de sprite
function createSprite(path, index, total, radius = 4.5, imageSize = 1) {
  const loader = new THREE.TextureLoader();
  return new Promise((resolve) => {
    loader.load(path, texture => {
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);

      const theta = Math.acos(-1 + (2 * index) / total);
      const phi = Math.sqrt(total * Math.PI) * theta;
      const x = radius * Math.cos(phi) * Math.sin(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(theta);
      sprite.position.set(x, y, z);
      sprite.scale.set(imageSize, imageSize, 1);

      scene.add(sprite);
      resolve();
    });
  });
}

// Chargement progressif des sprites (batch limit)
async function loadSpritesInBatches(imagePaths, batchSize = 5, delay = 100) {
  const radius = window.innerWidth < 768 ? 2.5 : window.innerWidth < 1024 ? 3.5 : 4.5;

  for (let i = 0; i < imagePaths.length; i += batchSize) {
    const batch = imagePaths.slice(i, i + batchSize);
    await Promise.all(
      batch.map((path, idx) => createSprite(path, i + idx, imagePaths.length, radius))
    );
    await new Promise(resolve => setTimeout(resolve, delay)); // petit délai entre lots
  }
}

// Chargement du JSON et lancement
fetch("img/images.json")
  .then(res => res.json())
  .then(images => {
    const paths = images.map(name => `img/${name}`);
    loadSpritesInBatches(paths, 4, 150); // ajuste selon la performance
  })
  .catch(err => console.error("Erreur chargement JSON:", err));

// Animation avec limite de FPS (~30 FPS)
let lastTime = 0;
function animate(time) {
  if (time - lastTime > 33) {
    scene.rotation.y += 0.002;
    renderer.render(scene, camera);
    lastTime = time;
  }
  requestAnimationFrame(animate);
}
animate();

// Redimensionnement
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight - 60;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  if (width < 768) camera.position.set(0, 0, 18);
  else if (width < 1024) camera.position.set(0, 0, 22);
  else camera.position.set(0, 0, 25);
});
