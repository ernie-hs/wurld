import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/Addons.js';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';

const simplex = new SimplexNoise();
const canvas = document.querySelector("#grid");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
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

const base_freq = 0.008;
const base_ampl = 20;
const base_harm = 12;

const noisy = noise(base_freq, base_ampl, base_harm);

const radius = 1000;
const size = 128;
const chunks = size * 4;

const landMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x2f4f4f,
  specularColor: 0xffffff,
  specularIntensity: 5
});
const landGeometry = new THREE.BoxGeometry(size, size, size, chunks, chunks, chunks);
sculpt(landGeometry.attributes.position.array, radius, noisy);
landGeometry.computeVertexNormals();
scene.add(new THREE.Mesh(landGeometry, landMaterial));

const seaMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x123456,
  opacity: 0.8,
  transparent: true,
  specularColor: 0x2f3f4f,
  specularIntensity: 9
});
const seaGeometry = new THREE.BoxGeometry(size, size, size, chunks, chunks, chunks);
makeSphere(seaGeometry.attributes.position.array, radius);
seaGeometry.computeVertexNormals();
scene.add(new THREE.Mesh(seaGeometry, seaMaterial));


const sun = new THREE.PointLight(0xffffff, 100000000);
sun.position.set(-50, 5000, 1000);
scene.add(sun);

function animate() {
  renderer.render(scene, camera);
}