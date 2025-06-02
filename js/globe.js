// Initialisation de la scène, caméra et rendu
const container = document.getElementById("globe-container");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
const navHeight = 60;
renderer.setSize(container.clientWidth, container.clientHeight - navHeight);
renderer.setSize(container.clientWidth, container.clientHeight - navHeight);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// Lumière ambiante
const light = new THREE.AmbientLight(0xffffff);
scene.add(light);

// Logo central
const logoTexture = new THREE.TextureLoader().load("img/logo.png");
const logoMaterial = new THREE.SpriteMaterial({ map: logoTexture });
const logoSprite = new THREE.Sprite(logoMaterial);
logoSprite.scale.set(1.5, 1.5, 1);
scene.add(logoSprite);

camera.position.z = 6;

// Fonction pour créer les sprites des images
function createSprites(imagePaths) {
  const textureLoader = new THREE.TextureLoader();
  const radius = window.innerWidth < 768 ? 2.5 : window.innerWidth < 1024 ? 3.5 : 4.5;
  const imageSize = 1;
  const total = imagePaths.length;

  imagePaths.forEach((path, index) => {
    textureLoader.load(path, texture => {
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
    });
  });
}

// Charger les images depuis le fichier JSON
fetch("img/images.json")
  .then(response => response.json())
  .then(images => {
    const imagePaths = images.map(name => `img/${name}`);
    createSprites(imagePaths);
  })
  .catch(error => {
    console.error("Erreur de chargement des images :", error);
  });

// Animation
function animate() {
  requestAnimationFrame(animate);
  scene.rotation.y += 0.002;
  renderer.render(scene, camera);
}
animate();

// Gestion du redimensionnement
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const navHeight = 60;
  const height = window.innerHeight - navHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  if (width < 768) {
    camera.position.set(0, 0, 18);
  } else if (width < 1024) {
    camera.position.set(0, 0, 22);
  } else {
    camera.position.set(0, 0, 25);
  }

  renderer.setSize(width, height);
});

  // Réajuste la position de la caméra selon la taille d’écran
  if (width < 768) {
    // Smartphone
    camera.position.set(0, 0, 20);
  } else if (width < 1024) {
    // Tablette
    camera.position.set(0, 0, 20);
  } else {
    // Ordinateur
    camera.position.set(0, 0, 20);
  }

  renderer.setSize(width, height);
});
