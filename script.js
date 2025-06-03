// globe.js – version conservant la structure d’origine
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ------------------------
//  Constantes & Réglages
// ------------------------
const COVER = 0.30; // % de surface de sphère que l’on veut réellement couvrir
// ------------------------
//  Marges d'interface (header fixe, bords)
// ------------------------
const UI = {
  top: 80,   // hauteur en px de ta barre de menus (adapte si besoin)
  edge: 16   // marge intérieure aux quatre bords
};

function getViewport () {
  // Surface réellement visible pour la 3D
  const w = window.innerWidth  - UI.edge * 2;
  const h = window.innerHeight - UI.top  - UI.edge * 2;
  return { width: w, height: h, aspect: w / h };
}

// ------------------------
//  Fonctions « responsive »
// ------------------------
function getResponsiveRadius () {
  // on part du côté le plus petit de la fenêtre
  const minDim = Math.min(window.innerWidth, window.innerHeight);
  // Rayon minimal (3) → smartphone  |  Rayon max (10) → très grand écran
  return THREE.MathUtils.clamp(minDim / 120, 3, 10);
}

function getAdaptiveRadius (numImages) {
  /**
   * Surface sphère 4πR² ≈ (nbImages × taillePlan²) / COVER
   * → R ≈ taillePlan × √(nbImages / (4πCOVER))
   */
  const planeSize = getResponsivePlaneSize();
  const radius    = planeSize * Math.sqrt(numImages / (4 * Math.PI * COVER));
  // bornes de sécurité
  return THREE.MathUtils.clamp(radius*1.2, 4, 20);
}

function getResponsivePlaneSize () {
  const width = window.innerWidth;
  // 1.2 → mobile, 2.8 → grand écran
  return THREE.MathUtils.clamp(width / 400, 1.2, 5.0);
}

function getNonOverlappingPlaneSize (numImages, radius) {
  /*  surface ≃ 4πR² / n  →  écart moyen ≃ √surface  */
  const CAMERA_MARGIN = 1.3;
  const areaPerPoint = 4 * Math.PI * radius * radius / numImages;
  const spacing      = Math.sqrt(areaPerPoint);   // distance centre-à-centre
  const safeDiag     = spacing * 0.75;             // 30 % de marge visuelle
  const safeSize     = safeDiag / Math.SQRT2;     // diag = size*√2
  // on respecte quand même la taille responsive maxi
  return Math.min(getResponsivePlaneSize(), safeSize);
}

function updateCameraDistance (radius, planeSize) {
  // Rayon englobant = sphère + demi-diagonale du plus grand plan
  const boundingR = radius + (planeSize * Math.SQRT2) / 2;

  const vp       = getViewport();
  const vFovRad  = THREE.MathUtils.degToRad(camera.fov);
  const hFovRad  = 2 * Math.atan(Math.tan(vFovRad / 2) * vp.aspect);

  const distV    = boundingR / Math.tan(vFovRad / 2);
  const distH    = boundingR / Math.tan(hFovRad / 2);
  const distance = Math.max(distV, distH) * 1.30;   // +5 % de marge

  camera.position.set(0, 0, distance);

  // bornes de zoom utilisateur
  controls.minDistance = distance * 0.8;
  controls.maxDistance = distance * 1.5;

  return distance;
}

// ------------------------
//  Génération des points uniformes sur la sphère
// ------------------------
function generatePointsOnSphere (numPoints, radius) {
  const points   = [];
  const offset   = 2 / numPoints;
  const increment = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < numPoints; i++) {
    const y   = ((i * offset) - 1) + (offset / 2);
    const r   = Math.sqrt(1 - y * y);
    const phi = i * increment;
    const x   = Math.cos(phi) * r;
    const z   = Math.sin(phi) * r;
    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }
  return points;
}

// ------------------------
//  Scène, caméra, renderer
// ------------------------
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x0a0f2c);
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping     = true;
controls.autoRotate        = true;
controls.autoRotateSpeed   = 2.0;
controls.enableZoom        = true;
// La distance exacte de la caméra sera ajustée plus tard
camera.position.set(0, 0, 80);

scene.add(new THREE.AmbientLight(0xffffff, 1));

// ------------------------
//  Chargement des images
// ------------------------
const loader    = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse     = new THREE.Vector2();

const imagesData = [
  { url: '../img/CHBR0.jpg', text: 'Image 0 - Description', group: 'A' },
  { url: '../img/CHBR1.jpg', text: 'Image 2 - Description', group: 'A' },
  { url: '../img/CUIEXT.jpg', text: 'Image 3 - Description', group: 'B' },
  { url: '../img/CUIEXT1.jpg', text: 'Image 4 - Description', group: 'B' },
  { url: '../img/CUIEXT2.jpg', text: 'Image 5 - Description', group: 'C' },
  { url: '../img/CUIEXT3.jpg', text: 'Image 6 - Description', group: 'C' },
  { url: '../img/CUIEXT4.jpg', text: 'Image 7 - Description', group: null },
  { url: '../img/CUIEXT5.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/CUIEXT6.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/CUIMARS1.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/CUIMARS2.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/CUIMARS3.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/CUIMARS4.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/Iso2.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/Iso3.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/Iso4.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/Iso5.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/Iso6.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/SDB1.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/SDB2.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/SDB3.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/SDB4.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/SDB5.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/WC1.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/WC2.jpg', text: 'Image 8 - Description', group: null },
  { url: '../cuisine_exterieure_cyporex.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/ext1.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/ext2.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/exterieur.jpg', text: 'Image 8 - Description', group: null },
  { url: '../img/Iso1.jpg', text: 'Image 8 - Description', group: null },
  { url: '../meuble-laura-1.jpg', text: 'Image 8 - Description', group: null },
  { url: '../meuble-laura-2.jpg', text: 'Image 8 - Description', group: null },
];

const planes = [];
let   spherePoints = [];

// ------------------------
//  Placement / mise à jour des plans
// ------------------------
function updatePositions () {
  const radius    = getAdaptiveRadius(planes.length);
  const planeSize = getNonOverlappingPlaneSize(planes.length, radius); // ⬅️ nouveau
  spherePoints    = generatePointsOnSphere(planes.length, radius);

  planes.forEach(({ mesh }, i) => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(planeSize, planeSize);
    mesh.position.copy(spherePoints[i]);
    mesh.lookAt(0, 0, 0);
  });

  updateCameraDistance(radius, planeSize);  // ⬅️ on passe planeSize
  controls.update();
}

// ------------------------
//  Chargement dynamique des textures
// ------------------------
imagesData.forEach((imgData, index) => {
  loader.load(
    imgData.url,
    (texture) => {
      console.log(`Image chargée (${index + 1}/${imagesData.length}):`, imgData.url);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const geometry = new THREE.PlaneGeometry(getResponsivePlaneSize(), getResponsivePlaneSize());
      const plane    = new THREE.Mesh(geometry, material);
      scene.add(plane);
      planes.push({ mesh: plane, data: imgData });
      updatePositions();
    },
    undefined,
    (error) => {
      console.warn('Erreur de chargement :', imgData.url, error);
    }
  );
});

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

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updatePositions();
});
