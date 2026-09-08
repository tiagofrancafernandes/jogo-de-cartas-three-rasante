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
        { x: -2.3, y: 0.08, z: 3.3, rotX: 0, rotY: 0, rotZ: 0 },
        { x: 0, y: 0.08, z: 3.3, rotX: 0, rotY: 0, rotZ: 0 },
        { x: 2.3, y: 0.08, z: 3.3, rotX: 0, rotY: 0, rotZ: 0 },
    ],
    CPU_HAND: [
        { x: -2.3, y: 0.08, z: -3.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
        { x: 0, y: 0.08, z: -3.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
        { x: 2.3, y: 0.08, z: -3.1, rotX: Math.PI, rotY: 0, rotZ: 0 },
    ],
    DRAW_PREVIEW: { x: -1.6, y: 1.1, z: 0.1, rotX: 0, rotY: 0, rotZ: 0 },
};

export type ViewMode = '3D' | '2D';
export type CameraDistance = 'far' | 'normal' | 'near';

const STORAGE_KEY_VIEW_MODE = 'rasante_view_mode';
const STORAGE_KEY_DISTANCE = 'rasante_camera_distance';

interface CameraPreset {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    up: { x: number; y: number; z: number };
}

const CAMERA_PRESETS: Record<ViewMode, Record<CameraDistance, CameraPreset>> = {
    '3D': {
        normal: {
            position: { x: 0, y: 9.6, z: 7.6 },
            target: { x: 0, y: -0.25, z: 0.4 },
            up: { x: 0, y: 1, z: 0 },
        },
        near: {
            position: { x: 0, y: 8.0, z: 6.2 },
            target: { x: 0, y: -0.25, z: 0.4 },
            up: { x: 0, y: 1, z: 0 },
        },
        far: {
            position: { x: 0, y: 11.6, z: 9.4 },
            target: { x: 0, y: -0.25, z: 0.4 },
            up: { x: 0, y: 1, z: 0 },
        },
    },
    '2D': {
        normal: {
            position: { x: 0, y: 11.8, z: 0.2 },
            target: { x: 0, y: 0, z: 0.2 },
            up: { x: 0, y: 0, z: -1 },
        },
        near: {
            position: { x: 0, y: 9.6, z: 0.2 },
            target: { x: 0, y: 0, z: 0.2 },
            up: { x: 0, y: 0, z: -1 },
        },
        far: {
            position: { x: 0, y: 14.5, z: 0.2 },
            target: { x: 0, y: 0, z: 0.2 },
            up: { x: 0, y: 0, z: -1 },
        },
    },
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
    private viewMode: ViewMode = '3D';
    private cameraDistance: CameraDistance = 'normal';
    private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, -0.25, 0.4);

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

        const savedViewMode = localStorage.getItem(STORAGE_KEY_VIEW_MODE);
        if (savedViewMode === '2D' || savedViewMode === '3D') {
            this.viewMode = savedViewMode;
        }

        const savedDistance = localStorage.getItem(STORAGE_KEY_DISTANCE);
        if (savedDistance === 'far' || savedDistance === 'menor') {
            this.cameraDistance = 'far';
        }
        if (savedDistance === 'near' || savedDistance === 'perto') {
            this.cameraDistance = 'near';
        }
        if (savedDistance === 'normal') {
            this.cameraDistance = 'normal';
        }

        this.applyCameraPreset(false);

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

    public getViewMode(): ViewMode {
        return this.viewMode;
    }

    public getCameraDistance(): CameraDistance {
        return this.cameraDistance;
    }

    public setViewMode(mode: ViewMode, animate: boolean = true): void {
        if (this.viewMode === mode && animate) {
            return;
        }

        this.resetHoverState();
        this.viewMode = mode;
        localStorage.setItem(STORAGE_KEY_VIEW_MODE, mode);

        this.applyCameraPreset(animate);
        this.updatePlayerCardRotations(animate);
    }

    public toggleViewMode(): ViewMode {
        const nextMode: ViewMode = this.viewMode === '3D' ? '2D' : '3D';
        this.setViewMode(nextMode, true);
        return nextMode;
    }

    public setCameraDistance(distance: CameraDistance, animate: boolean = true): void {
        if (this.cameraDistance === distance && animate) {
            return;
        }

        this.cameraDistance = distance;
        localStorage.setItem(STORAGE_KEY_DISTANCE, distance);

        this.applyCameraPreset(animate);
    }

    public cycleCameraDistance(): CameraDistance {
        if (this.cameraDistance === 'normal') {
            this.setCameraDistance('near', true);
            return this.cameraDistance;
        }

        if (this.cameraDistance === 'near') {
            this.setCameraDistance('far', true);
            return this.cameraDistance;
        }

        this.setCameraDistance('normal', true);
        return this.cameraDistance;
    }

    public applyCameraPreset(animate: boolean = true): void {
        const preset = CAMERA_PRESETS[this.viewMode][this.cameraDistance];

        if (!animate) {
            this.camera.position.set(preset.position.x, preset.position.y, preset.position.z);
            this.camera.up.set(preset.up.x, preset.up.y, preset.up.z);
            this.camera.lookAt(preset.target.x, preset.target.y, preset.target.z);
            this.currentLookAt.set(preset.target.x, preset.target.y, preset.target.z);
            return;
        }

        const animState = {
            posX: this.camera.position.x,
            posY: this.camera.position.y,
            posZ: this.camera.position.z,
            upX: this.camera.up.x,
            upY: this.camera.up.y,
            upZ: this.camera.up.z,
            targetX: this.currentLookAt.x,
            targetY: this.currentLookAt.y,
            targetZ: this.currentLookAt.z,
        };

        gsap.to(animState, {
            posX: preset.position.x,
            posY: preset.position.y,
            posZ: preset.position.z,
            upX: preset.up.x,
            upY: preset.up.y,
            upZ: preset.up.z,
            targetX: preset.target.x,
            targetY: preset.target.y,
            targetZ: preset.target.z,
            duration: 0.65,
            ease: 'power2.inOut',
            overwrite: 'auto',
            onUpdate: () => {
                this.camera.position.set(animState.posX, animState.posY, animState.posZ);
                this.camera.up.set(animState.upX, animState.upY, animState.upZ);
                this.camera.lookAt(animState.targetX, animState.targetY, animState.targetZ);
            },
            onComplete: () => {
                this.currentLookAt.set(preset.target.x, preset.target.y, preset.target.z);
            },
        });
    }

    public updatePlayerCardRotations(animate: boolean = true): void {
        const is2DMode = this.viewMode === '2D';

        for (let index = 0; index < this.playerCardMeshes.length; index++) {
            const mesh = this.playerCardMeshes[index];
            const baseSlot = SLOTS.PLAYER_HAND[index];

            if (!mesh || !baseSlot) {
                continue;
            }

            const targetRotX = is2DMode ? 0 : baseSlot.rotX;
            const targetRotY = is2DMode ? 0 : baseSlot.rotY;
            const targetRotZ = 0;

            if (!animate) {
                mesh.rotation.set(targetRotX, targetRotY, targetRotZ);
                mesh.scale.set(1, 1, 1);
                continue;
            }

            gsap.to(mesh.rotation, {
                x: targetRotX,
                y: targetRotY,
                z: targetRotZ,
                duration: 0.45,
                ease: 'power2.inOut',
                overwrite: 'auto',
            });
            gsap.to(mesh.scale, {
                x: 1,
                y: 1,
                z: 1,
                duration: 0.45,
                ease: 'power2.inOut',
                overwrite: 'auto',
            });
        }
    }

    public setPlayerCardMeshes(meshes: THREE.Mesh[]): void {
        this.playerCardMeshes = meshes;
        this.updatePlayerCardRotations(false);
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

        if (hoveredIndex === -1 || !SLOTS.PLAYER_HAND[hoveredIndex]) {
            return;
        }

        const baseSlot = SLOTS.PLAYER_HAND[hoveredIndex];

        if (this.viewMode === '2D') {
            gsap.to(firstMesh.scale, {
                x: 1.18,
                y: 1.18,
                z: 1.18,
                duration: 0.25,
                ease: 'power2.out',
                overwrite: 'auto',
            });
            gsap.to(firstMesh.position, {
                y: baseSlot.y + 0.2,
                duration: 0.25,
                ease: 'power2.out',
                overwrite: 'auto',
            });
            return;
        }

        gsap.to(firstMesh.position, {
            y: baseSlot.y + 0.35,
            z: baseSlot.z - 0.28,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
        });
        gsap.to(firstMesh.rotation, {
            x: 0.12,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
        });
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

            if (this.viewMode === '2D') {
                gsap.to(meshToReset.scale, {
                    x: 1.0,
                    y: 1.0,
                    z: 1.0,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
                gsap.to(meshToReset.position, {
                    y: originalSlot.y,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            }

            if (this.viewMode === '3D') {
                gsap.to(meshToReset.position, {
                    y: originalSlot.y,
                    z: originalSlot.z,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
                gsap.to(meshToReset.rotation, {
                    x: originalSlot.rotX,
                    duration: 0.25,
                    ease: 'power2.out',
                    overwrite: 'auto',
                });
            }
        }

        this.hoveredMesh = null;
        this.renderer.domElement.style.cursor = 'default';
    }
}
