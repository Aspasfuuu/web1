import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';



// Default reference size
let referenceSize = 10;

let loadedFont = null; // Store the font globally




// grid plane variables
export const planeOpacity = 0.5;
export const gridOpacity = 0.3;

// Function to set the reference size
export function setReferenceSize(size) {
    referenceSize = size;
}




export function createGridPlanes(){
    const group = new THREE.Group();
    const xColor = 0xB74F4F;
    const yColor = 0x4F7D4F;
    const zColor = 0x4F6D8F;
    
    
    const numGrids = Math.ceil(referenceSize);
    const gridSize = referenceSize;
    function createPlane(name, color, rotation, position) {
        const geometry = new THREE.PlaneGeometry(gridSize, gridSize);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            side: THREE.DoubleSide,  // Make sure it's visible from both sides
            opacity: planeOpacity,  
            transparent: true,  
            roughness: 0.5,  // Adjust surface roughness
            metalness: 0.2,   // Slight metallic reflection
            depthWrite: false
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.set(rotation.x, rotation.y, rotation.z);
        plane.position.set(position.x, position.y, position.z);
        plane.name = name;
        //plane.renderOrder = 1;
        return plane;
    }


const groupX = new THREE.Group();
groupX.name = "xGridGroup";
const groupY = new THREE.Group();
groupY.name = "yGridGroup";
const groupZ = new THREE.Group();
groupZ.name = "zGridGroup";

const xPlane = createPlane('xPlane', xColor, { x: 0, y: Math.PI/2, z: 0 }, { x: 0, y: 0, z: 0 }); // xPlane
const gridHelperX = new THREE.GridHelper(gridSize, numGrids, xColor, xColor);
gridHelperX.name = "xGrid";
gridHelperX.rotation.z = Math.PI / 2;
gridHelperX.material.opacity = gridOpacity;
gridHelperX.material.transparent = true;
groupX.add(xPlane, gridHelperX);

const yPlane = createPlane('yPlane', yColor, { x: Math.PI/2, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }); // yPlane
const gridHelperY = new THREE.GridHelper(gridSize, numGrids, yColor, yColor);
gridHelperY.name = "yGrid";
gridHelperY.material.opacity = gridOpacity;
gridHelperY.material.transparent = true;
groupY.add(yPlane, gridHelperY);

const zPlane = createPlane('zPlane', zColor, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }); // zPlane
const gridHelperZ = new THREE.GridHelper(gridSize, numGrids, zColor, zColor);
gridHelperZ.name = "zGrid";
gridHelperZ.rotation.x = Math.PI / 2;
gridHelperZ.material.opacity = gridOpacity;
gridHelperZ.material.transparent = true;
groupZ.add(zPlane, gridHelperZ);

group.add(groupX, groupY, groupZ);
return group;
}

// Function to create axis labels
 function createAxisLabel(text, position) {
    const div = document.createElement('div');
    div.className = 'axis-label';
    div.textContent = text;
    div.style.color = '#fff'; // White text
    div.style.fontSize = '14px';
    div.style.fontFamily = 'Arial';
    div.style.padding = '2px 5px';
    div.style.background = 'rgba(0, 0, 0, 0.5)'; // Dark background for contrast
    div.style.borderRadius = '5px';

    const label = new CSS2DObject(div);
    label.position.set(position.x, position.y, position.z);
    return label;
}

export function createAxisLabels(){
    const offset = referenceSize * 0.6;
    const xLabel = createAxisLabel('X', { x: offset, y: 0, z: 0 });
    xLabel.name = "xLabel";
    const yLabel = createAxisLabel('Y', { x: 0, y: offset, z: 0 });
    yLabel.name = "yLabel";
    const zLabel = createAxisLabel('Z', { x: 0, y: 0, z: offset });
    zLabel.name = "zLabel";
    return {xLabel, yLabel, zLabel};
}


export function createAxesHelper(){
    const axesHelper = new THREE.AxesHelper(referenceSize * 0.6);
    return axesHelper;
}

export function createToolbar(font, camera, renderTarget) {
    loadedFont = font;
    const toolbar = new THREE.Group();
    toolbar.name = "toolbar";

    // Button Base Size (Fixed)
    const buttonWidth = 0.3;
    const buttonHeight = 0.3;
    const paddingFactor = 0.2;
    const cellWidth = buttonWidth / (1 - paddingFactor);
    const cellHeight = buttonHeight / (1 - paddingFactor);
    const numButtons = 15;

    // Dynamically calculate cols & rows
    const screenRatio = window.innerWidth / window.innerHeight;
    const cols = Math.max(3, Math.floor(screenRatio * 10)); // Adjust columns based on width
    const rows = Math.max(2, Math.ceil(numButtons / cols)); // Ensure enough rows

    // Panel Size
    const panelWidth3D = cols * cellWidth;
    const panelHeight3D = rows * cellHeight;
    const panelDepth = 0.02;

    // Toolbar Panel
    const panelGeometry = new THREE.BoxGeometry(panelWidth3D, panelHeight3D, panelDepth);
    const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x552222, // Dark red tint
        transparent: true,
        opacity: 0.9, // Adjust transparency level
        roughness: 0.01, // Increase roughness to scatter light
        transmission: 0.8, // Allows light through but diffuses it
        thickness: 0.1, // Adds depth effect
        clearcoat: 0.9, // Enhances the glossy effect
        clearcoatRoughness: 0.4,
        ior: 1.2, // Controls how light bends inside the material
        side: THREE.BackSide,
        depthWrite: false, 
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.name = "toolbarPanel";
    toolbar.add(panel);

    const margin = panelHeight3D * 0.06; // Adjusted for better visibility
    const panelZPos = -3;
    const frustumHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * Math.abs(panelZPos);
    const bottomY = -frustumHeight / 2 + panelHeight3D / 2 + margin;

    // Apply position
    toolbar.position.set(0, bottomY, panelZPos);
    
   
    function addButton(name, color, col, row) {
        
        if (!loadedFont) {
            console.warn("Font not loaded yet. Skipping button:", name);
            return;
        }
        const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, 0.002);
        const buttonMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x000000,    // Pure black
            roughness: 0.05,    // Extra smooth for glossy effect
            metalness: 1.0,     // High metalness for reflectivity
            clearcoat: 1.0,     // Adds an extra glossy layer
            clearcoatRoughness: 0.05, // Makes the clearcoat smooth
        });
        
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);

        const xPos = -panelWidth3D / 2 + col * cellWidth + cellWidth / 2;
        const yPos = panelHeight3D / 2 - row * cellHeight - cellHeight / 2;
        button.position.set(xPos, yPos, panelDepth / 2 + 0.01);
        

        // Create text geometry
        const textGeometry = new TextGeometry(name, {
        font: loadedFont,
        size: cellHeight * 0.12, // Scale relative to button size
        height: 0.02
        });

        // Center the text inside the button
        textGeometry.computeBoundingBox();
        // Get bounding box dimensions (avoid null issues)
        const bbox = textGeometry.boundingBox;
        const textWidth = bbox ? bbox.max.x - bbox.min.x : 0;
        const textHeight = bbox ? bbox.max.y - bbox.min.y : 0;
        const textMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x8B0000,
            emissive: 0x8B0000,
            emissiveIntensity: 2.0,
            clearcoat: 0.8, // Adds a glossy effect
            clearcoatRoughness: 0.1
        });
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(xPos - textWidth / 2, yPos - textHeight / 2, panelDepth / 2 + 0.003);
        textMesh.scale.set(1,1, 0.0002)
        toolbar.add(textMesh);
        toolbar.add(button);
        
        
    }

    // Add buttons in a grid layout
    let buttonIndex = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (buttonIndex >= 3) break; // Limit buttons to 15
            addButton(`button${buttonIndex}`, 0x5555ff, c, r);
            buttonIndex++;
        }
    }

    function createPanelGrid() {
        const gridLines = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });

        for (let i = 0; i <= cols; i++) {
            const x = -panelWidth3D / 2 + i * cellWidth;
            const points = [new THREE.Vector3(x, panelHeight3D / 2, panelDepth / 2 + 0.01),
                            new THREE.Vector3(x, -panelHeight3D / 2, panelDepth / 2 + 0.01)];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            gridLines.add(new THREE.Line(lineGeometry, lineMaterial));
        }

        for (let j = 0; j <= rows; j++) {
            const y = panelHeight3D / 2 - j * cellHeight;
            const points = [new THREE.Vector3(-panelWidth3D / 2, y, panelDepth / 2 + 0.01),
                            new THREE.Vector3(panelWidth3D / 2, y, panelDepth / 2 + 0.01)];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            gridLines.add(new THREE.Line(lineGeometry, lineMaterial));
        }

        return gridLines;
    }

    toolbar.add(createPanelGrid());

    return toolbar;
}

export function addTextOnXPlane(text, position, size, color, font) {
    if (!font) {
        console.warn("Font not loaded yet. Skipping text:", text);
        return null;
    }

    const textGeometry = new TextGeometry(text, {
        font: font,
        size: size,
        height: 0.001,
        bevelEnabled: false,
        
    });

    textGeometry.computeBoundingBox();
    const bbox = textGeometry.boundingBox;
    const textWidth = bbox ? bbox.max.x - bbox.min.x : 0;
    const textHeight = bbox ? bbox.max.y - bbox.min.y : 0;

    

    const textMaterial = new THREE.MeshBasicMaterial({ 
        color: color, 
        side: THREE.DoubleSide 
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(position.x - textWidth / 2, position.y - textHeight / 2, position.z);
    textMesh.rotation.x = -Math.PI / 2;
    console.log(textMesh);
    
    textMesh.scale.set(1,1,0.01);

    return textMesh;
}









