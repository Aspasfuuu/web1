import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {setReferenceSize, createToolbar, createGridPlanes, createAxisLabels, createAxesHelper} from './components.js';
import { initEventHandlers, updateTheme } from './events.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';



// variables
let sceneComponents = {};
let loadedFont = null;






// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Add Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 50;

// creating components
setReferenceSize(10);
sceneComponents = createComponents();


// Create a CSS2DRenderer for 2D text labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild(labelRenderer.domElement);

// ALSO UPDATE CSS2DRenderer INTERACTION
labelRenderer.domElement.style.pointerEvents = 'none'; // Prevent interference


// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    camera.remove(sceneComponents.toolbar);
    const toolbar = createToolbar(loadedFont, camera);
    camera.add(toolbar);
    sceneComponents.toolbar = toolbar;
});

// Initialize Event Handlers
initEventHandlers(scene, camera, controls, moveCamera);


// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    sceneComponents.cube.rotation.x += 0.01;
    sceneComponents.cube.rotation.y += 0.01;
    animateCamera();
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function setInitialCameraPosition() {
    const aspectRatio = window.innerWidth / window.innerHeight;

    // Adjust distance based on aspect ratio
    let distance = aspectRatio > 1 ? 10 : 15; // Wider screens get a closer view

    camera.position.set(distance, distance, distance);
    camera.lookAt(0, 0, 0);
}

setInitialCameraPosition();


// Toggle Dark Mode
let isDark = false; // Change this dynamically later
updateTheme(isDark, scene, renderer);

function createComponents(){
    let objects = {};

    // Create a Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhysicalMaterial({
            color: 0x552222, // Dark red tint
            transparent: false,
            opacity: 1, // Adjust transparency level
            roughness: 0.7, // High roughness for frosted effect
            transmission: 0.1, // Allows light to pass through, like glass
            thickness: 0.05, // Simulated thickness for depth effect
            clearcoat: 0.5, // Enhances the glass-like reflections
            clearcoatRoughness: 0.3,
            side: THREE.DoubleSide, 
        });
    const cube = new THREE.Mesh(geometry, material);
    //scene.add(cube);
    objects.cube = cube;

     // Axes Helper
     const axesHelper = createAxesHelper();
     scene.add(axesHelper);
     objects.axesHelper = axesHelper;

     // Add labels for each axis
    const axisLabels = createAxisLabels();
    scene.add(axisLabels.xLabel, axisLabels.yLabel, axisLabels.zLabel);
    objects.axisLabels = axisLabels;
    
    const gridGroup = createGridPlanes();
    scene.add(gridGroup);
    objects.gridGroup = gridGroup;

    

    function loadFont() {
        return new Promise((resolve) => {
            const fontLoader = new FontLoader();
            fontLoader.load('./assets/fonts/helvetiker_regular.typeface.json', resolve);
        });
    }
    
    loadFont().then((font) => {
        loadedFont = font;
        const toolbar = createToolbar(font, camera);
        if (toolbar) {
            camera.add(toolbar);
            scene.add(camera);
            objects.toolbar = toolbar;

        }
    });
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Soft ambient light
    scene.add(ambientLight);
    objects.ambientLight= ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
    directionalLight.position.set(5, 5, 5); // Position from top-right
    scene.add(directionalLight);
    objects.directionalLight = directionalLight;

    
    return objects;

}

function getScreenBounds(object, camera, renderer) {


    const box = new THREE.Box3().setFromObject(object);
    const min = box.min.clone();
    const max = box.max.clone();

    // Convert 3D bounding box corners to 2D screen space
    const ndcMin = min.project(camera); // Normalize to NDC (-1 to 1)
    const ndcMax = max.project(camera);

    // Convert NDC to UV (0 to 1)
    const xMin = (ndcMin.x + 1) / 2;
    const yMin = (ndcMin.y + 1) / 2;
    const xMax = (ndcMax.x + 1) / 2;
    const yMax = (ndcMax.y + 1) / 2;

    return new THREE.Vector4(xMin, yMin, xMax, yMax);
}

// Camera Target Variables
let targetPosition = new THREE.Vector3();
let targetLookAt = new THREE.Vector3();
let overshootPosition = new THREE.Vector3();
let isMoving = false;


// Function to Move Camera Smoothly
let progress = 0; // Track animation progress
const moveSpeed = 0.01; // Controls speed of movement

function moveCamera(targetPos, lookAtPos) {
    // Calculate overshoot position (go 20% further in the same direction)
    const overshootFactor = 0.98;  
    const overshootPos = targetPos.clone().multiplyScalar(overshootFactor);
    
    // Set target positions
    targetPosition.copy(targetPos);
    targetLookAt.copy(lookAtPos);
    overshootPosition = overshootPos; // Temporary overshoot
    progress = 0; // Reset animation progress
    
    if(Math.abs(targetPos.y)>0) {
        
        
        progress = 1;
    }
    isMoving = true;
}

function animateCamera(){
    if (isMoving) {
        progress += moveSpeed; // Move progress forward

        if (progress < 0.2) {
            // First half: Move towards overshoot position
            camera.position.lerp(overshootPosition,  progress * 2 );
        } else {
            // Second half: Move back to target position
            camera.position.lerp(targetPosition, (progress - 0.2) * 2);
        }

        controls.target.lerp(targetLookAt, 0.1); // Adjust camera focus smoothly
        
        // Stop moving when close enough
        if (progress >= 1) {
            camera.position.copy(targetPosition);
            controls.target.copy(targetLookAt);
            isMoving = false;
        }
    }
}


setTimeout(() => {
    animate();
}, 1000); 

