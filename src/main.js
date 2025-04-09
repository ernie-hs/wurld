import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/Addons.js';
import { SimplexNoise } from 'three/examples/jsm/Addons.js';

const simplex = new SimplexNoise();
const canvas = document.querySelector("#grid");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
const control = new ArcballControls(camera, canvas, scene);
control.update();

camera.position.y = 1;
camera.position.z = 40;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);

function noise(bf, ba, h) {
  const a = Array(h).keys().toArray().map(i => 2 ** i);
  return (x, y) => a.reduce((p, c) => p + simplex.noise(x * bf * c, y * bf * c) * ba / c);
}

function sculpt(data, noisefn) {
  for (let j = 0, l = data.length; j < l; j += 3) {
    data[j + 1] = noisefn(data[j], data[j + 2]);
  }
}

function makeLandGeometry(origin, sizeX, sizeY, chunksX, chunksY, noisefn) {
  const geometry = new THREE.PlaneGeometry(sizeX, sizeY, chunksX, chunksY);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(origin[0], origin[1], origin[2]);
  sculpt(geometry.attributes.position.array, noisefn);
  geometry.computeVertexNormals();
  return geometry;
}

function makeLandStrip(origin, size, chunks, noisefn, strips) {
  return Array(strips).keys().map(s => {
    const n = 2 ** s;
    return makeLandGeometry([origin[0] + size * s, origin[1], origin[2]], size / n, size, chunks / n, chunks / n, noisefn);
  });
}

const base_freq = 0.005;
const base_ampl = 20;
const base_harm = 12;

const noisy = noise(base_freq, base_ampl, base_harm);

const size = 128;
const chunks = size * 4;

const material = new THREE.MeshPhysicalMaterial({
  color: 0x2f4f4f,
  specularColor: 0xffffff,
  specularIntensity: 5
});

const strips = 5;

makeLandStrip([0, 0, 0], size, chunks, noisy, strips).forEach(s => {
  scene.add(new THREE.Mesh(s, material));
});

const defaultLand = makeLandGeometry([size * 2, 0, 0], size * strips, size, chunks * strips, chunks, noisy);
defaultLand.translate(0, 0, size);
scene.add(new THREE.Mesh(defaultLand, material));

const seaGeometry = new THREE.PlaneGeometry(size * strips, size * 2);
seaGeometry.rotateX(-Math.PI / 2);
seaGeometry.translate(size * 2, 0, size / 2);
seaGeometry.computeVertexNormals();

const seaMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x123456,
  opacity: 0.8,
  transparent: true,
  specularColor: 0x2f3f4f,
  specularIntensity: 9
});
const sea = new THREE.Mesh(seaGeometry, seaMaterial);
scene.add(sea);

const sun = new THREE.PointLight(0xffffff, 1000000);
sun.position.set(-10, 500, 50);
scene.add(sun);

function animate() {
  renderer.render(scene, camera);
}