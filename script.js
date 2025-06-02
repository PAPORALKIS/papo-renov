// document.addEventListener("DOMContentLoaded", function () {
//   const zoomables = document.querySelectorAll('.realisation-image');
//   const lightbox = document.getElementById('lightbox');
//   const lightboxImg = document.getElementById('lightbox-img');

//   zoomables.forEach(img => {
//     img.addEventListener('click', (e) => {
//       e.stopPropagation();
//       lightboxImg.src = img.src;
//       lightbox.style.display = 'flex';
//     });
//   });

//   lightbox.addEventListener('click', function () {
//     lightbox.style.display = 'none';
//     lightboxImg.src = '';
//   });
// });

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Rayon responsive basé sur la taille de l'écran
function getResponsiveRadius() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minDim = Math.min(width, height);

  if (minDim < 480) return 2.5;
  if (minDim < 768) return 3.5;
  if (minDim < 1024) return 4.5;
  return 5.5;
}

function getAdaptiveRadius(numImages) {
  let base = getResponsiveRadius();
  return base + Math.log(numImages); // pour éviter les chevauchements
}

// Taille des plans responsive selon l'écran
function getResponsivePlaneSize() {
  const width = window.innerWidth;
  if (width < 480) return 1.5;
  if (width < 768) return 2;
  if (width < 1024) return 2.5;
  return 3;
}

// Fonction qui génère N points uniformément répartis sur une sphère selon la méthode Fibonacci
function generatePointsOnSphere(numPoints, radius) {
  const points = [];
  const offset = 2 / numPoints;
  const increment = Math.PI * (3 - Math.sqrt(5)); // angle d'or

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

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / (window.innerHeight - 60), // 👈 tenir compte barre nav de 60px
  0.1,
  1000
);
camera.position.set(0, 1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight - 60); // 👈 renderer sous nav
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x0a0f2c); // fond bleu foncé

document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 3; // vitesse de rotation

function getCameraDistance() {
  const width = window.innerWidth;
  if (width < 768) return 18;
  if (width < 1024) return 22;
  return 25;
}
const dist = getCameraDistance();
// À définir au bon endroit si besoin

controls.addEventListener('start', () =>{
  controls.autoRotate = false;
});

controls.addEventListener('end', () => {
  // Quand l'utilisateur arrête la manipulation (rotation par exemple),
  // on repositionne la caméra devant le globe (axe Z positif)
  camera.position.set(0, 0, dist);
  controls.target.set(0, 0, 0); // assure que le contrôle regarde toujours le centre
  controls.update();
  // redémarrer l’auto rotation 
  controls.autoRotate = true;
});

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

// On prépare d'abord tous les points sur la sphère pour éviter chevauchements
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

  camera.position.set(0, 0, radius + 4); // ajuste zoom selon globe
}

imagesData.forEach((imgData) => {
  loader.load(imgData.url, (texture) => {
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
    const geometry = new THREE.PlaneGeometry(getResponsivePlaneSize(), getResponsivePlaneSize());
    const plane = new THREE.Mesh(geometry, material);

    // On va assigner la position dans updatePositions() plus tard
    plane.position.set(0, 0, 0);
    scene.add(plane);
    planes.push({ mesh: plane, data: imgData });
    });
       });



function loadAllTextures(imagesData) {
  const loader = new THREE.TextureLoader();
  const planeSize = getResponsivePlaneSize();

  return Promise.all(imagesData.map(imgData => {
    return new Promise(resolve => {
      loader.load(imgData.url, texture => {
        const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true });
        const geometry = new THREE.PlaneGeometry(planeSize, planeSize);
        const plane = new THREE.Mesh(geometry, material);

        plane.position.set(0, 0, 0);
        scene.add(plane);
        planes.push({ mesh: plane, data: imgData });

        resolve(); // ✅ image chargée
      });
    });
  }));
}

// Clic pour ouvrir preview
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planes.map(p => p.mesh));

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const clickedData = planes.find(p => p.mesh === clickedMesh).data;
    const groupKey = clickedData.group;
    let groupImages = groupKey ? imagesData.filter(img => img.group === groupKey) : [clickedData];
    openPreview(groupImages);
  }
}

window.addEventListener('click', onMouseClick);

// Gestion du carrousel preview
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
  preview.style.display = 'flex'; // ❗ Correction : classList.remove → style.display
  document.body.style.overflow = 'auto'; // ❗ Correction : overlow → overflow
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
  document.getElementById('container').style.filter = 'none';
});

// Animation & mise à jour
// Resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight - 60;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updatePositions();

  if (width < 768) {
    camera.position.set(0, 0, 30);
  } else if (width < 1024) {
    camera.position.set(0, 0, 30);
  } else {
    camera.position.set(0, 0, 30);
  }

})'
