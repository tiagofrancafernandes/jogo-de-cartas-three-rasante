import { gsap } from 'gsap';
import * as THREE from 'three';

export interface CardSlotCoordinates {
    x: number;
    y: number;
    z: number;
    rotX: number;
    rotY: number;
    rotZ: number;
}

export const SLOTS = {
    DRAW_DECK: { x: -3.8, y: 0.06, z: 0.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
    ACTIVE_CENTER: { x: 0, y: 0.08, z: 0.1, rotX: 0, rotY: 0, rotZ: 0 },
    DISCARD_PILE: { x: 3.8, y: 0.06, z: 0.1, rotX: 0, rotY: 0, rotZ: 0 },
    KING_CEMETERY: { x: 3.8, y: 0.06, z: -3.1, rotX: 0, rotY: 0, rotZ: 0 },
    PLAYER_HAND: [
        { x: -2.3, y: 0.1, z: 3.3, rotX: -0.26, rotY: 0.04, rotZ: 0 },
        { x: 0, y: 0.1, z: 3.3, rotX: -0.26, rotY: 0, rotZ: 0 },
        { x: 2.3, y: 0.1, z: 3.3, rotX: -0.26, rotY: -0.04, rotZ: 0 },
    ],
    CPU_HAND: [
        { x: -2.3, y: 0.08, z: -3.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
        { x: 0, y: 0.08, z: -3.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
        { x: 2.3, y: 0.08, z: -3.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
    ],
    DRAW_PREVIEW: { x: -1.6, y: 1.1, z: 0.1, rotX: 0, rotY: 0, rotZ: 0 },
};

export class SceneManager {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private raycaster: THREE.Raycaster;
    private pointer: THREE.Vector2;
    private playerCardMeshes: THREE.Mesh[] = [];
    private hoveredMesh: THREE.Mesh | null = null;
    private isInteractive: boolean = true;
    private onPlayerCardClickCallback?: (cardIndex: number) => void;

    public constructor(container: HTMLElement) {
        if (!container) {
            throw new Error('SceneManager requires a valid container HTMLElement');
        }

        this.container = container;
        this.scene = new THREE.Scene();
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2(-999, -999);

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
        this.camera.position.set(0, 9.6, 7.6);
        this.camera.lookAt(0, -0.25, 0.4);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;

        this.container.appendChild(this.renderer.domElement);

        this.setupEnvironment();
        this.setupEventListeners();
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public setPlayerCardMeshes(meshes: THREE.Mesh[]): void {
        this.playerCardMeshes = meshes;
    }

    public setInteractive(isInteractive: boolean): void {
        this.isInteractive = isInteractive;

        if (!isInteractive && this.hoveredMesh) {
            this.resetHoverState();
        }
    }

    public onPlayerCardClick(callback: (cardIndex: number) => void): void {
        this.onPlayerCardClickCallback = callback;
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public handleResize(): void {
        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    private setupEnvironment(): void {
        // Elegant deep casino felt background
        this.scene.background = new THREE.Color(0x0c281e);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        this.scene.add(ambientLight);

        // Directional spotlight with soft shadows
        const mainLight = new THREE.DirectionalLight(0xfff8ee, 1.6);
        mainLight.position.set(5, 18, 6);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 30;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.bias = -0.0005;
        this.scene.add(mainLight);

        // Secondary fill light for depth
        const fillLight = new THREE.DirectionalLight(0x70a1ff, 0.4);
        fillLight.position.set(-6, 12, -4);
        this.scene.add(fillLight);

        // Felt table surface
        const tableGeometry = new THREE.CylinderGeometry(11, 11.2, 0.4, 64);
        const tableMaterial = new THREE.MeshStandardMaterial({
            color: 0x165b40,
            roughness: 0.8,
            metalness: 0.05,
        });
        const tableMesh = new THREE.Mesh(tableGeometry, tableMaterial);
        tableMesh.position.y = -0.2;
        tableMesh.receiveShadow = true;
        this.scene.add(tableMesh);

        // Wooden table rim
        const rimGeometry = new THREE.TorusGeometry(11.1, 0.5, 16, 64);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d1c06,
            roughness: 0.5,
            metalness: 0.1,
        });
        const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = -0.15;
        rimMesh.receiveShadow = true;
        this.scene.add(rimMesh);

        this.createSlotMarkers();
    }

    private createSlotMarkers(): void {
        const markerGeometry = new THREE.PlaneGeometry(1.9, 2.7);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
        });

        // Draw deck marker
        const deckMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        deckMarker.rotation.x = -Math.PI / 2;
        deckMarker.position.set(SLOTS.DRAW_DECK.x, 0.01, SLOTS.DRAW_DECK.z);
        this.scene.add(deckMarker);

        // Center active card marker
        const activeMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        activeMarker.rotation.x = -Math.PI / 2;
        activeMarker.position.set(SLOTS.ACTIVE_CENTER.x, 0.01, SLOTS.ACTIVE_CENTER.z);
        this.scene.add(activeMarker);

        // Discard marker
        const discardMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        discardMarker.rotation.x = -Math.PI / 2;
        discardMarker.position.set(SLOTS.DISCARD_PILE.x, 0.01, SLOTS.DISCARD_PILE.z);
        this.scene.add(discardMarker);

        // King Cemetery marker
        const cemeteryMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        cemeteryMarker.rotation.x = -Math.PI / 2;
        cemeteryMarker.position.set(SLOTS.KING_CEMETERY.x, 0.01, SLOTS.KING_CEMETERY.z);
        this.scene.add(cemeteryMarker);
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        const domElement = this.renderer.domElement;

        domElement.addEventListener('pointermove', (event: PointerEvent) => {
            const rect = domElement.getBoundingClientRect();
            this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.checkHover();
        });

        domElement.addEventListener('click', () => {
            if (!this.isInteractive) {
                return;
            }

            if (!this.hoveredMesh) {
                return;
            }

            const clickedIndex = this.playerCardMeshes.indexOf(this.hoveredMesh);

            if (clickedIndex === -1) {
                return;
            }

            if (this.onPlayerCardClickCallback) {
                this.onPlayerCardClickCallback(clickedIndex);
            }
        });
    }

    private checkHover(): void {
        if (!this.isInteractive || this.playerCardMeshes.length === 0) {
            this.resetHoverState();
            return;
        }

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.playerCardMeshes);

        if (intersects.length === 0) {
            this.resetHoverState();
            return;
        }

        const firstMesh = intersects[0].object as THREE.Mesh;

        if (this.hoveredMesh === firstMesh) {
            return;
        }

        this.resetHoverState();
        this.hoveredMesh = firstMesh;
        this.renderer.domElement.style.cursor = 'pointer';

        const hoveredIndex = this.playerCardMeshes.indexOf(firstMesh);

        if (hoveredIndex !== -1 && SLOTS.PLAYER_HAND[hoveredIndex]) {
            const baseSlot = SLOTS.PLAYER_HAND[hoveredIndex];
            gsap.to(firstMesh.position, {
                y: baseSlot.y + 0.35,
                z: baseSlot.z - 0.28,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        }
    }

    private resetHoverState(): void {
        if (!this.hoveredMesh) {
            this.renderer.domElement.style.cursor = 'default';
            return;
        }

        const meshToReset = this.hoveredMesh;
        const hoveredIndex = this.playerCardMeshes.indexOf(meshToReset);

        if (hoveredIndex !== -1 && SLOTS.PLAYER_HAND[hoveredIndex]) {
            const originalSlot = SLOTS.PLAYER_HAND[hoveredIndex];
            gsap.to(meshToReset.position, {
                y: originalSlot.y,
                z: originalSlot.z,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        }

        this.hoveredMesh = null;
        this.renderer.domElement.style.cursor = 'default';
    }
}
