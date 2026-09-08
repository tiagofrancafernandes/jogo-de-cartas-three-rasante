import { gsap } from 'gsap';
import * as THREE from 'three';
import { SLOTS } from './SceneManager';

const ANIM_DURATION_FAST = 0.35;
const ANIM_DURATION_NORMAL = 0.5;
const ANIM_DURATION_SLOW = 0.7;

export class AnimationQueue {
    private isBusyFlag: boolean = false;
    private viewMode: '3D' | '2D' = '3D';

    public isBusy(): boolean {
        return this.isBusyFlag;
    }

    public setBusy(busy: boolean): void {
        this.isBusyFlag = busy;
    }

    public reset(): void {
        gsap.killTweensOf('*');
        this.isBusyFlag = false;
    }

    public setViewMode(mode: '3D' | '2D'): void {
        this.viewMode = mode;
    }

    private getPlayerHandRotation(index: number): { rotX: number; rotY: number; rotZ: number } {
        if (this.viewMode === '2D') {
            return { rotX: 0, rotY: 0, rotZ: 0 };
        }

        const slot = SLOTS.PLAYER_HAND[index];
        return { rotX: slot.rotX, rotY: slot.rotY, rotZ: slot.rotZ };
    }

    public async animateInitialDeal(
        playerMeshes: THREE.Mesh[],
        cpuMeshes: THREE.Mesh[],
        activeMesh: THREE.Mesh
    ): Promise<void> {
        this.isBusyFlag = true;

        // Reset positions to deck
        const allMeshes = [...playerMeshes, ...cpuMeshes, activeMesh];

        for (const mesh of allMeshes) {
            mesh.position.set(SLOTS.DRAW_DECK.x, SLOTS.DRAW_DECK.y, SLOTS.DRAW_DECK.z);
            mesh.rotation.set(SLOTS.DRAW_DECK.rotX, SLOTS.DRAW_DECK.rotY, SLOTS.DRAW_DECK.rotZ);
        }

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isBusyFlag = false;
            },
        });

        // Deal cards sequentially
        for (let index = 0; index < 3; index++) {
            const playerMesh = playerMeshes[index];
            const playerSlot = SLOTS.PLAYER_HAND[index];
            const playerRot = this.getPlayerHandRotation(index);

            timeline.to(
                playerMesh.position,
                {
                    x: playerSlot.x,
                    y: playerSlot.y,
                    z: playerSlot.z,
                    duration: ANIM_DURATION_FAST,
                    ease: 'power2.out',
                },
                index * 0.15
            );

            timeline.to(
                playerMesh.rotation,
                {
                    x: playerRot.rotX,
                    y: playerRot.rotY,
                    z: playerRot.rotZ,
                    duration: ANIM_DURATION_FAST,
                    ease: 'power2.out',
                },
                index * 0.15
            );

            const cpuMesh = cpuMeshes[index];
            const cpuSlot = SLOTS.CPU_HAND[index];

            timeline.to(
                cpuMesh.position,
                {
                    x: cpuSlot.x,
                    y: cpuSlot.y,
                    z: cpuSlot.z,
                    duration: ANIM_DURATION_FAST,
                    ease: 'power2.out',
                },
                index * 0.15 + 0.08
            );

            timeline.to(
                cpuMesh.rotation,
                {
                    x: cpuSlot.rotX,
                    y: cpuSlot.rotY,
                    z: cpuSlot.rotZ,
                    duration: ANIM_DURATION_FAST,
                    ease: 'power2.out',
                },
                index * 0.15 + 0.08
            );
        }

        // Flip active card to center
        timeline.to(
            activeMesh.position,
            {
                x: SLOTS.ACTIVE_CENTER.x,
                y: SLOTS.ACTIVE_CENTER.y,
                z: SLOTS.ACTIVE_CENTER.z,
                duration: ANIM_DURATION_NORMAL,
                ease: 'power2.out',
            },
            '+=0.1'
        );

        timeline.to(
            activeMesh.rotation,
            {
                x: SLOTS.ACTIVE_CENTER.rotX,
                y: SLOTS.ACTIVE_CENTER.rotY,
                z: SLOTS.ACTIVE_CENTER.rotZ,
                duration: ANIM_DURATION_NORMAL,
                ease: 'power2.out',
            },
            '<'
        );

        await timeline;
    }

    public async animateCardPlay(
        playedMesh: THREE.Mesh,
        collectedMesh: THREE.Mesh,
        actor: 'PLAYER' | 'CPU',
        handIndex: number
    ): Promise<void> {
        this.isBusyFlag = true;

        const targetHandSlot = actor === 'PLAYER' ? SLOTS.PLAYER_HAND[handIndex] : SLOTS.CPU_HAND[handIndex];

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isBusyFlag = false;
            },
        });

        // Move played card to center
        timeline.to(
            playedMesh.position,
            {
                x: SLOTS.ACTIVE_CENTER.x,
                y: SLOTS.ACTIVE_CENTER.y + 0.04,
                z: SLOTS.ACTIVE_CENTER.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0
        );

        timeline.to(
            playedMesh.rotation,
            {
                x: SLOTS.ACTIVE_CENTER.rotX,
                y: SLOTS.ACTIVE_CENTER.rotY,
                z: SLOTS.ACTIVE_CENTER.rotZ,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0
        );

        // Move collected card from center to hand
        const targetHandRot =
            actor === 'PLAYER'
                ? this.getPlayerHandRotation(handIndex)
                : { rotX: targetHandSlot.rotX, rotY: targetHandSlot.rotY, rotZ: targetHandSlot.rotZ };

        timeline.to(
            collectedMesh.position,
            {
                x: targetHandSlot.x,
                y: targetHandSlot.y,
                z: targetHandSlot.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0.1
        );

        timeline.to(
            collectedMesh.rotation,
            {
                x: targetHandRot.rotX,
                y: targetHandRot.rotY,
                z: targetHandRot.rotZ,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0.1
        );

        await timeline;
    }

    public async animateDrawSuccess(
        drawnMesh: THREE.Mesh,
        oldActiveMesh: THREE.Mesh,
        discardCount: number
    ): Promise<void> {
        this.isBusyFlag = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isBusyFlag = false;
            },
        });

        // Draw from deck to preview
        timeline.to(
            drawnMesh.position,
            {
                x: SLOTS.DRAW_PREVIEW.x,
                y: SLOTS.DRAW_PREVIEW.y,
                z: SLOTS.DRAW_PREVIEW.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0
        );

        timeline.to(
            drawnMesh.rotation,
            {
                x: SLOTS.DRAW_PREVIEW.rotX,
                y: SLOTS.DRAW_PREVIEW.rotY,
                z: SLOTS.DRAW_PREVIEW.rotZ,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0
        );

        // Old active moves to discard
        timeline.to(
            oldActiveMesh.position,
            {
                x: SLOTS.DISCARD_PILE.x,
                y: SLOTS.DISCARD_PILE.y + discardCount * 0.015,
                z: SLOTS.DISCARD_PILE.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '+=0.2'
        );

        // Drawn card takes center
        timeline.to(
            drawnMesh.position,
            {
                x: SLOTS.ACTIVE_CENTER.x,
                y: SLOTS.ACTIVE_CENTER.y,
                z: SLOTS.ACTIVE_CENTER.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '<'
        );

        await timeline;
    }

    public async animateDrawPenalty(
        drawnMesh: THREE.Mesh,
        forcedMesh: THREE.Mesh,
        handReplacementMesh: THREE.Mesh,
        actor: 'PLAYER' | 'CPU',
        handIndex: number,
        discardCount: number
    ): Promise<void> {
        this.isBusyFlag = true;

        const targetHandSlot = actor === 'PLAYER' ? SLOTS.PLAYER_HAND[handIndex] : SLOTS.CPU_HAND[handIndex];

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isBusyFlag = false;
            },
        });

        // Draw card to preview
        timeline.to(
            drawnMesh.position,
            {
                x: SLOTS.DRAW_PREVIEW.x,
                y: SLOTS.DRAW_PREVIEW.y,
                z: SLOTS.DRAW_PREVIEW.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0
        );

        timeline.to(
            drawnMesh.rotation,
            {
                x: SLOTS.DRAW_PREVIEW.rotX,
                y: SLOTS.DRAW_PREVIEW.rotY,
                z: SLOTS.DRAW_PREVIEW.rotZ,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            0
        );

        // Drawn card goes straight to discard
        timeline.to(
            drawnMesh.position,
            {
                x: SLOTS.DISCARD_PILE.x,
                y: SLOTS.DISCARD_PILE.y + discardCount * 0.015,
                z: SLOTS.DISCARD_PILE.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '+=0.25'
        );

        // Forced active card goes to player's hand
        const targetHandRot =
            actor === 'PLAYER'
                ? this.getPlayerHandRotation(handIndex)
                : { rotX: targetHandSlot.rotX, rotY: targetHandSlot.rotY, rotZ: targetHandSlot.rotZ };

        timeline.to(
            forcedMesh.position,
            {
                x: targetHandSlot.x,
                y: targetHandSlot.y,
                z: targetHandSlot.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '<'
        );

        timeline.to(
            forcedMesh.rotation,
            {
                x: targetHandRot.rotX,
                y: targetHandRot.rotY,
                z: targetHandRot.rotZ,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '<'
        );

        // Hand replacement goes to center
        timeline.to(
            handReplacementMesh.position,
            {
                x: SLOTS.ACTIVE_CENTER.x,
                y: SLOTS.ACTIVE_CENTER.y,
                z: SLOTS.ACTIVE_CENTER.z,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '<'
        );

        timeline.to(
            handReplacementMesh.rotation,
            {
                x: SLOTS.ACTIVE_CENTER.rotX,
                y: SLOTS.ACTIVE_CENTER.rotY,
                z: SLOTS.ACTIVE_CENTER.rotZ,
                duration: ANIM_DURATION_FAST,
                ease: 'power2.out',
            },
            '<'
        );

        await timeline;
    }

    public async animateKingBanishment(
        kingMesh: THREE.Mesh,
        cemeteryCount: number,
        replacementMesh: THREE.Mesh | null
    ): Promise<void> {
        this.isBusyFlag = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isBusyFlag = false;
            },
        });

        // Fly King to cemetery with dramatic flip
        timeline.to(
            kingMesh.position,
            {
                x: SLOTS.KING_CEMETERY.x,
                y: SLOTS.KING_CEMETERY.y + cemeteryCount * 0.02,
                z: SLOTS.KING_CEMETERY.z,
                duration: ANIM_DURATION_SLOW,
                ease: 'power3.inOut',
            },
            0
        );

        timeline.to(
            kingMesh.rotation,
            {
                x: 0,
                y: Math.PI * 2,
                z: 0.1,
                duration: ANIM_DURATION_SLOW,
                ease: 'power3.inOut',
            },
            0
        );

        // If replacement card exists, draw it to center
        if (replacementMesh) {
            replacementMesh.position.set(SLOTS.DRAW_DECK.x, SLOTS.DRAW_DECK.y, SLOTS.DRAW_DECK.z);
            replacementMesh.rotation.set(SLOTS.DRAW_DECK.rotX, SLOTS.DRAW_DECK.rotY, SLOTS.DRAW_DECK.rotZ);

            timeline.to(
                replacementMesh.position,
                {
                    x: SLOTS.ACTIVE_CENTER.x,
                    y: SLOTS.ACTIVE_CENTER.y,
                    z: SLOTS.ACTIVE_CENTER.z,
                    duration: ANIM_DURATION_NORMAL,
                    ease: 'power2.out',
                },
                '-=0.2'
            );

            timeline.to(
                replacementMesh.rotation,
                {
                    x: SLOTS.ACTIVE_CENTER.rotX,
                    y: SLOTS.ACTIVE_CENTER.rotY,
                    z: SLOTS.ACTIVE_CENTER.rotZ,
                    duration: ANIM_DURATION_NORMAL,
                    ease: 'power2.out',
                },
                '<'
            );
        }

        await timeline;
    }

    public async animateRevealCpuHand(cpuMeshes: THREE.Mesh[]): Promise<void> {
        this.isBusyFlag = true;

        const timeline = gsap.timeline({
            onComplete: () => {
                this.isBusyFlag = false;
            },
        });

        for (let index = 0; index < cpuMeshes.length; index++) {
            const mesh = cpuMeshes[index];

            timeline.to(
                mesh.rotation,
                {
                    x: 0,
                    duration: ANIM_DURATION_FAST,
                    ease: 'back.out(1.5)',
                },
                index * 0.1
            );
        }

        await timeline;
    }
}
