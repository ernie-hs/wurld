import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/Addons.js';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';

const simplex = new SimplexNoise();
const canvas = document.querySelector("#grid");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  logarithmicDepthBuffer: true
});
const control = new ArcballControls(camera, canvas, scene);
control.update();

camera.position.z = 3000;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

function noise(bf, ba, h) {
  const a = Array(h).keys().toArray().map(i => 2 ** i);
  return (x, y, z) => a.reduce((p, c) => p + simplex.noise3d(x * bf * c, y * bf * c, z * bf * c) * ba / c);
}

function makeSphere(data, radius) {
  for (let j = 0, l = data.length; j < l; j += 3) {
    let v = new THREE.Vector3(data[j], data[j + 1], data[j + 2]);
    let n = v.clone().normalize();
    let k = n.clone().multiplyScalar(radius);
    data[j] = k.x;
    data[j + 1] = k.y;
    data[j + 2] = k.z;
  }
}

function sculpt(data, radius, noisefn) {
  for (let j = 0, l = data.length; j < l; j += 3) {
    let v = new THREE.Vector3(data[j], data[j + 1], data[j + 2]);
    let n = v.clone().normalize();
    let k = n.clone().multiplyScalar(radius).add(n.multiplyScalar(noisefn(v.x, v.y, v.z)));
    data[j] = k.x;
    data[j + 1] = k.y;
    data[j + 2] = k.z;
  }
}

const base_freq = 0.01;
const base_ampl = 20;
const base_harm = 12;

const noisy = noise(base_freq, base_ampl, base_harm);

const radius = 1000;
const size = 128;
const chunks = size * 4;

const planet = new THREE.Group();

const landMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x228B22,
  specularColor: 0x329B32,
  specularIntensity: 3
});
const landGeometry = new THREE.BoxGeometry(size, size, size, chunks, chunks, chunks);
sculpt(landGeometry.attributes.position.array, radius, noisy);
landGeometry.computeVertexNormals();
planet.add(new THREE.Mesh(landGeometry, landMaterial));

const seaMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x123456,
  opacity: 0.9,
  transparent: true,
  specularColor: 0x2f3f4f,
  specularIntensity: 12
});
const seaGeometry = new THREE.BoxGeometry(size, size, size, chunks, chunks, chunks);
makeSphere(seaGeometry.attributes.position.array, radius);
seaGeometry.computeVertexNormals();
planet.add(new THREE.Mesh(seaGeometry, seaMaterial));

scene.add(planet);

const moon = new THREE.Group();
const scale = 4;

const moonMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x393939,
  specularColor: 0x999999,
  specularIntensity: 3
});
const moonGeometry = new THREE.BoxGeometry(size / scale, size / scale, size / scale, chunks / scale, chunks / scale, chunks / scale);
sculpt(moonGeometry.attributes.position.array, radius / scale, noisy);
moonGeometry.computeVertexNormals();
moon.add(new THREE.Mesh(moonGeometry, moonMaterial));
moon.position.set(radius * 2.5, 0, 0);

const moonOrbit = new THREE.Group();
moonOrbit.add(moon);
scene.add(moonOrbit);

const sun = new THREE.PointLight(0xffffff, 100000000);
sun.position.set(-5000, -1000, 1000);
scene.add(sun);

function animate() {
  moonOrbit.rotation.y += 0.005;
  planet.rotation.y += 0.001;
  renderer.render(scene, camera);
}