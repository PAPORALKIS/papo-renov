// ✅ Importations
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ✅ Hauteur de la barre de menu
const menuHeight = 60;

// ✅ Fonctions responsives mises à jour
function getResponsiveRadius() {
  const canvas = renderer.domElement;
  const minDim = Math.min(canvas.clientWidth, canvas.clientHeight);
  if (minDim < 480) return 3;
  if (minDim < 768) return 4;
  if (minDim < 1024) return 5;
  return 6;
}

function getAdaptiveRadius(numImages) {
  let base = getResponsiveRadius();
  return base + Math.log2(numImages + 1);
}

function getResponsivePlaneSize() {
  const width = renderer.domElement.clientWidth;
  if (width < 480) return 1.3;
  if (width < 768) return 1.7;
  if (width < 1024) return 2.2;
  return 2.8;
}

function generatePointsOnSphere(numPoints, radius) {
  const points = [];
  const offset = 2 / numPoints;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < numPoints; i++) {
    const y = ((i * offset) - 1) + (offset / 2);
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;
    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }
  return points;
}

// ✅ Scène et rendu
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const container = document.getElementById('container');
container.appendChild(renderer.domElement);
container.style.position = 'absolute';
container.style.top = `${menuHeight}px`;
container.style.left = '0';
container.style.width = '100%';
container.style.height = `calc(100vh - ${menuHeight}px)`;
container.style.overflow = 'hidden';

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight - menuHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updatePositions(); // ✅ Recalcule sur redimensionnement
}
resizeRenderer();

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x0a0f2c);

// ✅ Contrôles caméra
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 2.0;
controls.enableZoom = true;
camera.position.set(0, 0, 30);

scene.add(new THREE.AmbientLight(0xffffff, 1));

// ✅ Chargement des textures
const loader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const imagesData = [
  { url: '../img/CHBR0.jpg', text: 'Image 0 - Description', group: 'A' },
  { url: '../img/CHBR1.jpg', text: 'Image 2 - Description', group: 'A' },
  { url: '../img/CUIEXT.jpg', text: 'Image 3 - Description', group: 'B' },
  { url: '../img/CUIEXT1.jpg', text: 'Image 4 - Description', group: 'B' },
  { url: '../img/CUIEXT2.jpg', text: 'Image 5 - Description', group: 'C' },
  { url: '../img/CUIEXT3.jpg', text: 'Image 6 - Description', group: 'C' },
  { url: '../img/CUIEXT4.jpg', text: 'Image 7 - Description', group: null },
  // ... (autres images inchangées)
];

const planes = [];
let spherePoints = [];

function updatePositions() {
  const radius = getAdaptiveRadius(planes.length);
  const planeSize = getResponsivePlaneSize();
  spherePoints = generatePointsOnSphere(planes.length, radius);

  planes.forEach(({ mesh }, i) => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(planeSize, planeSize);
    const pos = spherePoints[i];
    mesh.position.copy(pos);
    mesh.lookAt(0, 0, 0);
  });

  camera.position.set(0, 0, radius + 6);
  controls.update();
}

let loadedCount = 0;
const totalImages = imagesData.length;

imagesData.forEach((imgData) => {
  loader.load(
    imgData.url,
    (texture) => {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const geometry = new THREE.PlaneGeometry(getResponsivePlaneSize(), getResponsivePlaneSize());
      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);
      planes.push({ mesh: plane, data: imgData });

      loadedCount++;
      if (loadedCount === totalImages) updatePositions();
    },
    undefined,
    (error) => console.warn('Erreur de chargement :', imgData.url, error)
  );
});

// ✅ Interaction clic sur image
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planes.map(p => p.mesh));
  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const clickedData = planes.find(p => p.mesh === clickedMesh).data;
    const groupKey = clickedData.group;
    const groupImages = groupKey ? imagesData.filter(img => img.group === groupKey) : [clickedData];
    openPreview(groupImages);
  }
}

window.addEventListener('click', onMouseClick);

// ✅ Preview modal
const preview = document.getElementById('preview');
const carouselImage = document.getElementById('carousel-image');
const carouselText = document.getElementById('carousel-text');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const closePreviewBtn = document.getElementById('close-preview');

let currentGroup = [];
let currentIndex = 0;

function openPreview(groupImages) {
  currentGroup = groupImages;
  currentIndex = 0;
  showImage(currentIndex);
  preview.style.display = 'flex';
  document.getElementById('container').style.transform = 'translateY(100px)';
  document.body.style.overflow = 'auto';
}

function showImage(index) {
  if (index < 0) index = currentGroup.length - 1;
  if (index >= currentGroup.length) index = 0;
  currentIndex = index;
  carouselImage.src = currentGroup[index].url;
  carouselText.textContent = currentGroup[index].text;
}

prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
closePreviewBtn.addEventListener('click', () => {
  preview.style.display = 'none';
  document.getElementById('container').style.transform = 'translateY(0)';
});

// ✅ Animation continue
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ✅ Événement de redimensionnement
window.addEventListener('resize', () => {
  resizeRenderer();
});
