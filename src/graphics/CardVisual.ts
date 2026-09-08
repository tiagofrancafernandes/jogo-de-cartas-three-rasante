import * as THREE from 'three';
import { Card, Suit } from '../core/types';

const CARD_WIDTH = 1.8;
const CARD_HEIGHT = 0.04;
const CARD_DEPTH = 2.6;

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 560;
const BORDER_PADDING = 10;
const CORNER_RADIUS = 20;

export class CardVisual {
    private static faceTextureCache: Map<string, THREE.CanvasTexture> = new Map();
    private static backTexture: THREE.CanvasTexture | null = null;

    public static createCardMesh(card: Card): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH);

        const faceTexture = CardVisual.getOrCreateFaceTexture(card);
        const backTexture = CardVisual.getOrCreateBackTexture();

        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xeaeaea,
            roughness: 0.6,
            metalness: 0.1,
        });

        const faceMaterial = new THREE.MeshStandardMaterial({
            map: faceTexture,
            roughness: 0.4,
            metalness: 0.05,
        });

        const backMaterial = new THREE.MeshStandardMaterial({
            map: backTexture,
            roughness: 0.4,
            metalness: 0.05,
        });

        // Box faces order: [+X, -X, +Y (Top/Face), -Y (Bottom/Back), +Z, -Z]
        const materials = [edgeMaterial, edgeMaterial, faceMaterial, backMaterial, edgeMaterial, edgeMaterial];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
            cardId: card.id,
            card,
        };

        return mesh;
    }

    public static getSuitGlyph(suit: Suit): string {
        if (suit === Suit.HEARTS) {
            return '♥';
        }

        if (suit === Suit.DIAMONDS) {
            return '♦';
        }

        if (suit === Suit.CLUBS) {
            return '♣';
        }

        return '♠';
    }

    public static isRedSuit(suit: Suit): boolean {
        return suit === Suit.HEARTS || suit === Suit.DIAMONDS;
    }

    private static getOrCreateFaceTexture(card: Card): THREE.CanvasTexture {
        const cacheKey = `${card.label}_${card.suit}`;
        const cached = CardVisual.faceTextureCache.get(cacheKey);

        if (cached) {
            return cached;
        }

        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        const context = canvas.getContext('2d');

        if (!context) {
            const fallbackTexture = new THREE.CanvasTexture(canvas);
            return fallbackTexture;
        }

        CardVisual.drawCardFace(context, card);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        CardVisual.faceTextureCache.set(cacheKey, texture);

        return texture;
    }

    private static getOrCreateBackTexture(): THREE.CanvasTexture {
        if (CardVisual.backTexture) {
            return CardVisual.backTexture;
        }

        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        const context = canvas.getContext('2d');

        if (!context) {
            const fallback = new THREE.CanvasTexture(canvas);
            return fallback;
        }

        CardVisual.drawCardBack(context);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        CardVisual.backTexture = texture;

        return texture;
    }

    private static drawCardFace(context: CanvasRenderingContext2D, card: Card): void {
        const isRed = CardVisual.isRedSuit(card.suit);
        const suitGlyph = CardVisual.getSuitGlyph(card.suit);
        const textColor = isRed ? '#d63031' : '#2d3436';

        // White card background with subtle gradient
        const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f1f2f6');

        context.fillStyle = gradient;
        CardVisual.drawRoundedRect(
            context,
            BORDER_PADDING,
            BORDER_PADDING,
            CANVAS_WIDTH - BORDER_PADDING * 2,
            CANVAS_HEIGHT - BORDER_PADDING * 2,
            CORNER_RADIUS
        );
        context.fill();

        // Elegant inner border
        context.strokeStyle = isRed ? '#fab1a0' : '#b2bec3';
        context.lineWidth = 3;
        CardVisual.drawRoundedRect(
            context,
            BORDER_PADDING + 8,
            BORDER_PADDING + 8,
            CANVAS_WIDTH - (BORDER_PADDING + 8) * 2,
            CANVAS_HEIGHT - (BORDER_PADDING + 8) * 2,
            CORNER_RADIUS - 4
        );
        context.stroke();

        // Top-left rank & suit
        context.fillStyle = textColor;
        context.font = 'bold 44px "Inter", "Arial", sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(card.label, 32, 30);

        context.font = '38px "Arial", sans-serif';
        context.fillText(suitGlyph, 34, 78);

        // Bottom-right rank & suit (rotated)
        context.save();
        context.translate(CANVAS_WIDTH - 32, CANVAS_HEIGHT - 30);
        context.rotate(Math.PI);
        context.font = 'bold 44px "Inter", "Arial", sans-serif';
        context.fillText(card.label, 0, 0);
        context.font = '38px "Arial", sans-serif';
        context.fillText(suitGlyph, 2, 48);
        context.restore();

        // Big center artwork
        context.font = '120px "Arial", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = textColor;
        context.fillText(suitGlyph, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        // Points badge at bottom
        context.font = 'bold 20px "Inter", "Arial", sans-serif';
        context.fillStyle = '#636e72';
        context.fillText(`${card.points} PTS`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }

    private static drawCardBack(context: CanvasRenderingContext2D): void {
        // Deep royal navy background
        context.fillStyle = '#0f172a';
        CardVisual.drawRoundedRect(
            context,
            BORDER_PADDING,
            BORDER_PADDING,
            CANVAS_WIDTH - BORDER_PADDING * 2,
            CANVAS_HEIGHT - BORDER_PADDING * 2,
            CORNER_RADIUS
        );
        context.fill();

        // Golden / brass border
        context.strokeStyle = '#d97706';
        context.lineWidth = 4;
        CardVisual.drawRoundedRect(
            context,
            BORDER_PADDING + 6,
            BORDER_PADDING + 6,
            CANVAS_WIDTH - (BORDER_PADDING + 6) * 2,
            CANVAS_HEIGHT - (BORDER_PADDING + 6) * 2,
            CORNER_RADIUS - 2
        );
        context.stroke();

        // Geometric pattern
        context.strokeStyle = 'rgba(217, 119, 6, 0.25)';
        context.lineWidth = 1.5;

        const step = 20;

        for (let x = -CANVAS_HEIGHT; x < CANVAS_WIDTH + CANVAS_HEIGHT; x += step) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x + CANVAS_HEIGHT, CANVAS_HEIGHT);
            context.stroke();

            context.beginPath();
            context.moveTo(x, CANVAS_HEIGHT);
            context.lineTo(x + CANVAS_HEIGHT, 0);
            context.stroke();
        }

        // Center emblem
        context.fillStyle = '#0f172a';
        context.beginPath();
        context.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 44, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = '#f59e0b';
        context.lineWidth = 3;
        context.stroke();

        context.font = 'bold 24px "Inter", "Arial", sans-serif';
        context.fillStyle = '#f59e0b';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('✈', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    private static drawRoundedRect(
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }
}
