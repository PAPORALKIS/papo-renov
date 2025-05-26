// Initialisation de la scène, caméra et rendu const container = document.getElementById("globe-container"); const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000); const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); renderer.setSize(container.clientWidth, container.clientHeight); renderer.setPixelRatio(window.devicePixelRatio); container.appendChild(renderer.domElement);

// Lumière const light = new THREE.AmbientLight(0xffffff); scene.add(light);

// Logo central const logoTexture = new THREE.TextureLoader().load("img/logo.png"); const logoMaterial = new THREE.SpriteMaterial({ map: logoTexture }); const logoSprite = new THREE.Sprite(logoMaterial); logoSprite.scale.set(1.5, 1.5, 1); scene.add(logoSprite);

camera.position.z = 6;

// Fonction pour créer les sprites function createSprites(imagePaths) { const textureLoader = new THREE.TextureLoader(); const radius = 2.5; const imageSize = 1; const total = imagePaths.length;

imagePaths.forEach((path, index) => { textureLoader.load(path, texture => { const material = new THREE.SpriteMaterial({ map: texture, transparent: true }); const sprite = new THREE.Sprite(material);

const theta = Math.acos(-1 + (2 * index) / total);
  const phi = Math.sqrt(total * Math.PI) * theta;

  const x = radius * Math.cos(phi) * Math.sin(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(theta);

  sprite.position.set(x, y, z);
  sprite.scale.set(imageSize, imageSize, 1);
  scene.add(sprite);
});

}); }

// Charger les images depuis le fichier JSON fetch("img/images.json") .then(response => response.json()) .then(images => { const imagePaths = images.map(name => img/${name}); createSprites(imagePaths); }) .catch(error => { console.error("Erreur de chargement des images :", error); });

// Animation function animate() { requestAnimationFrame(animate); scene.rotation.y += 0.002; renderer.render(scene, camera); } animate();

// Gestion du redimensionnement window.addEventListener("resize", () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); });

