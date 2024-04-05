import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();

let branchesController = null;
let randomnessController = null;
let radiusController = null;

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const starTexture = textureLoader.load("/textures/particles/9.png");
const moonTexture = textureLoader.load("/textures/particles/6.png");
const sphereTexture = textureLoader.load("/textures/particles/1.png");

/**
 * Galaxy Generator
 */

let controls = null;
let camera = null;
const galaxyParameters = {
    count: 300000,
    size: 0.02,

    radius: 5,
    branches: 3,
    spin: 0.1,

    randomness: 0.18,
    randomnessPower: 3,

    form: "star",
    shape: "spin",
    direction: "default",

    colorInside: "#ff809f",
    colorOutside: "#1b47f5",

    opacity: 1,

    autoRotate: true,
    autoRotateSpeed: 0.5,

    SLEEP() {
        updateGalaxyGenerator();
    },
};

let pointsGeometry = null;
let pointsMaterial = null;
let points = null;

const galaxy = new THREE.Group();
scene.add(galaxy);

const updateGalaxyGenerator = () => {
    //Sleep tweaks
    if (camera) {
        camera.position.set(0, 5, 0);

        galaxyParameters.branches = 5;
        if (branchesController) branchesController.setValue(5);

        galaxyParameters.randomness = 0;
        if (randomnessController) randomnessController.setValue(0);

        galaxyParameters.radius = 20;
        if (radiusController) radiusController.setValue(20);

        galaxyGenerator();
    }
};

const galaxyGenerator = () => {
    if (pointsGeometry !== null) pointsGeometry.dispose();
    if (pointsMaterial !== null) pointsMaterial.dispose();
    scene.remove(points);

    //Geometry
    pointsGeometry = new THREE.BufferGeometry();

    const verticies = new Float32Array(galaxyParameters.count * 3);
    const colors = new Float32Array(galaxyParameters.count * 3);
    const sizes = new Float32Array(galaxyParameters.count * 1);
    const randomness = new Float32Array(galaxyParameters.count * 3);

    for (let i = 0; i < galaxyParameters.count; i++) {
        const i3 = i * 3;

        const radius = Math.random() * galaxyParameters.radius;
        const spinAngle = radius * galaxyParameters.spin;
        let branchAngle = ((i % galaxyParameters.branches) / galaxyParameters.branches) * Math.PI * 2 * 1;

        //Randomness
        const randomX = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParameters.randomness * radius;
        const randomY = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParameters.randomness * radius;
        const randomZ = Math.pow(Math.random(), galaxyParameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParameters.randomness * radius;

        randomness[i3 + 0] = randomX;
        randomness[i3 + 1] = randomY;
        randomness[i3 + 2] = randomZ;

        //Shape

        let shapeX = Math.cos(branchAngle + spinAngle) * radius;
        let shapeY = 0.0;
        let shapeZ = Math.sin(branchAngle + spinAngle) * radius;

        if (galaxyParameters.shape === "sin") {
            shapeX = Math.cos(branchAngle + Math.sin(spinAngle)) * radius;
            shapeZ = Math.sin(branchAngle + Math.sin(spinAngle)) * radius;
        }

        verticies[i3] = shapeX;
        verticies[i3 + 1] = galaxyParameters.direction === "up" ? 5 / radius : shapeY;
        verticies[i3 + 2] = shapeZ;

        //Colors
        const colorInside = new THREE.Color(galaxyParameters.colorInside);
        const colorOutside = new THREE.Color(galaxyParameters.colorOutside);

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / galaxyParameters.radius);

        colors[i3 + 0] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        sizes[i] = Math.random();
    }

    pointsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(verticies, 3));
    pointsGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    pointsGeometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    pointsGeometry.setAttribute("aRandomness", new THREE.Float32BufferAttribute(randomness, 3));

    //Material
    pointsMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        opacity: galaxyParameters.opacity,
        uniforms: {
            uSize: { value: 20.0 * renderer.getPixelRatio() },
            uTime: { value: 0.0 },
            uAutoRotate: { value: galaxyParameters.autoRotate },
            uAutoRotateSpeed: { value: 0.2 },
        },
    });

    if (galaxyParameters.form !== "default") {
        let texture = starTexture;
        galaxyParameters.form === "sphere" ? (texture = sphereTexture) : "";
        galaxyParameters.form === "moon" ? (texture = moonTexture) : "";
        pointsMaterial.map = texture;
    }

    points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);
};

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 5;

scene.add(camera);

// Controls
controls = new OrbitControls(camera, canvas);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

galaxyGenerator();

/*
 * GUI
 */

//Particles
const particles = gui.addFolder("Particles");
particles.add(galaxyParameters, "count").min(100).max(100000).step(1).onFinishChange(galaxyGenerator);
particles.add(galaxyParameters, "form", ["default", "star", "sphere", "moon"]).onFinishChange(galaxyGenerator);

//Sizes
const sizeFolder = gui.addFolder("Common");
radiusController = sizeFolder.add(galaxyParameters, "radius").min(0.5).max(20).step(0.001).onFinishChange(galaxyGenerator);
sizeFolder.add(galaxyParameters, "opacity").min(0).max(1).step(0.001).onFinishChange(galaxyGenerator);

//Branches
const branches = gui.addFolder("Branches");
branchesController = branches.add(galaxyParameters, "branches").min(2).max(20).step(1).onFinishChange(galaxyGenerator);

//Spin
const spin = gui.addFolder("Shape");
spin.add(galaxyParameters, "spin").min(-5).max(5).step(0.01).onFinishChange(galaxyGenerator);
spin.add(galaxyParameters, "shape", ["spin", "sin"]).onFinishChange(galaxyGenerator);

//Randomness
const randomness = gui.addFolder("Randomness");
randomnessController = randomness.add(galaxyParameters, "randomness").min(0).max(2).step(0.01).onFinishChange(galaxyGenerator);
randomness.add(galaxyParameters, "randomnessPower").min(1).max(10).step(0.001).onFinishChange(galaxyGenerator);

//Direction
const direction = gui.addFolder("Direction");
direction.add(galaxyParameters, "direction", ["default", "up"]).onFinishChange(galaxyGenerator);

//Colors
const colors = gui.addFolder("Colors");
colors.addColor(galaxyParameters, "colorInside").onFinishChange(galaxyGenerator);
colors.addColor(galaxyParameters, "colorOutside").onFinishChange(galaxyGenerator);

//Contriols
const controlsFolder = gui.addFolder("Controls").close();
controlsFolder
    .add(galaxyParameters, "autoRotate")
    .name("auto rotate")
    .onChange(() => {
        pointsMaterial.uniforms.uAutoRotate = galaxyParameters.autoRotate;
        galaxyGenerator();
    });
controlsFolder.add(pointsMaterial.uniforms.uAutoRotateSpeed, "value").min(0).max(5).step(0.001);

//Sleep
const sleep = gui.addFolder("Sleep");
sleep.add(galaxyParameters, "SLEEP").onFinishChange(galaxyGenerator);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update controls
    controls.update();

    //Update uniforms
    pointsMaterial.uniforms.uTime.value = elapsedTime;

    camera.updateProjectionMatrix();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
