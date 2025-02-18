import * as THREE from 'three';
import {planeOpacity} from './components.js';

let isDragging = false;
let isMouseDown = false;
let hoveredObject = null;
let isNormal = false;
const originalOpacity = planeOpacity;
const hoverOpacity = Math.min(0.7, 2*planeOpacity);
const mouse = new THREE.Vector2();
const mouseDownPos = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let camera, scene, controls, moveCamera; // References from main.js


// Store camera target positions
const cameraPositions = {
    'Y': { position: new THREE.Vector3(0, 10, 0), lookAt: new THREE.Vector3(0, 0, 0) }, 
    'X': { position: new THREE.Vector3(10, 0, 0), lookAt: new THREE.Vector3(0, 0, 0) },
    'Z': { position: new THREE.Vector3(0, 0, 10), lookAt: new THREE.Vector3(0, 0, 0) }
};

// Initialize event listeners with scene references
export function initEventHandlers(sceneRef, cameraRef, controlsRef, moveCameraFn) {
    scene = sceneRef;
    camera = cameraRef;
    controls = controlsRef;
    moveCamera = moveCameraFn;

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
}

// Mouse Down
function onMouseDown(event) {
    isMouseDown = true;
    mouseDownPos.set(event.clientX, event.clientY);
}

// Mouse Move (Hover Effect)
function onMouseMove(event) {
    if (isMouseDown) {
        if (mouseDownPos.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 5) {
            isDragging = true; // Mark as dragging if movement > 5px
        }
        if(isDragging){
        isNormal = false;
        scene.getObjectByName("xLabel").visible = true;
        scene.getObjectByName("yLabel").visible = true;
        scene.getObjectByName("zLabel").visible = true;
        const xPlane = scene.getObjectByName('xPlane');
        const yPlane = scene.getObjectByName('yPlane');
        const zPlane = scene.getObjectByName('zPlane');

        xPlane.position.x = 0;
        yPlane.position.y = 0;
        zPlane.position.z = 0;

        scene.getObjectByName("xGridGroup").visible = true;
        scene.getObjectByName("yGridGroup").visible = true;
        scene.getObjectByName("zGridGroup").visible = true;

        return; // Ignore hover logic when dragging
        }
    }

    if(!isNormal){
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    let plane = intersects.find(obj => ['xPlane', 'yPlane', 'zPlane'].includes(obj.object.name))?.object;
    
    if (plane) {
        if (hoveredObject && hoveredObject !== plane) {
            hoveredObject.material.opacity = originalOpacity;
        }
        plane.material.opacity = hoverOpacity;
        hoveredObject = plane;
    } else if (hoveredObject) {
        hoveredObject.material.opacity = originalOpacity;
        hoveredObject = null;
    }

    }

}

// Mouse Up (Click Event)
function onMouseUp(event) {
    isMouseDown = false;
    if (!isDragging && !isNormal) {
        handleClick(event);
    }
    isDragging = false;
}

// Handle Plane Click
function handleClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    let clickedPlane = intersects.find(obj => ['xPlane', 'yPlane', 'zPlane'].includes(obj.object.name))?.object;

    if (clickedPlane) {
        let planeName = clickedPlane.name.charAt(0).toUpperCase();
        if (cameraPositions[planeName]) {
            
            isNormal = true;
            hoveredObject.material.opacity = originalOpacity;
            scene.getObjectByName(clickedPlane.name.charAt(0)+"Label").visible = false;
            switch(clickedPlane.name){
                case 'xPlane':{
                    scene.getObjectByName('yGridGroup').visible = false;
                    scene.getObjectByName('zGridGroup').visible = false;
                    if(camera.position.x>0) moveCamera(cameraPositions[planeName].position, cameraPositions[planeName].lookAt);
                    else moveCamera(cameraPositions[planeName].position.clone().multiplyScalar(-1), cameraPositions[planeName].lookAt);
            
                    clickedPlane.position.x -= 0.01;
                    
                } break;
                case 'yPlane':{
                    scene.getObjectByName('xGridGroup').visible = false;
                    scene.getObjectByName('zGridGroup').visible = false;
                    if(camera.position.y>0) moveCamera(cameraPositions[planeName].position, cameraPositions[planeName].lookAt);
                    else moveCamera(cameraPositions[planeName].position.clone().multiplyScalar(-1), cameraPositions[planeName].lookAt);
            
                    clickedPlane.position.y -= 0.01;
                    
                } break;
                case 'zPlane':{
                    scene.getObjectByName('xGridGroup').visible = false;
                    scene.getObjectByName('yGridGroup').visible = false;
                    if(camera.position.z>0) moveCamera(cameraPositions[planeName].position, cameraPositions[planeName].lookAt);
                    else moveCamera(cameraPositions[planeName].position.clone().multiplyScalar(-1), cameraPositions[planeName].lookAt);
            
                    clickedPlane.position.z -= 0.01;
                    
                } 

            }
            
            
        }
    }
}

export function updateTheme(isDark, scene, renderer) {
    const darkColors = {
        x: 0xB74F4F,
        y: 0x4F7D4F,
        z: 0x4F6D8F,
        background: 0x202020 // Dark background
    };
    const lightColors = {
        x: 0xDD6666, // Deeper red for contrast
        y: 0x66AA66, // Deeper green for contrast
        z: 0x6688DD, // Deeper blue for contrast
        background: 0xE8E8E8 // Slightly off-white for better contrast
    };

    const colors = isDark ? darkColors : lightColors;

    function updateGroup(groupName, color) {
        const group = scene.getObjectByName(groupName);
        if (group) {
            group.children.forEach((child) => {
                if (child.type === "Mesh" || child.type === "LineSegments") {
                    child.material.color.set(color);
                }
            });
        }
    }

    updateGroup("xGridGroup", colors.x);
    updateGroup("yGridGroup", colors.y);
    updateGroup("zGridGroup", colors.z);

    // Update scene background
    scene.background = new THREE.Color(colors.background);

    // Update renderer clear color
    renderer.setClearColor(colors.background);
}

