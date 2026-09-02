// Egyszeru particle rendszer: forgacs, szikra, fust, hamu.

import { PAL } from './config.js';

const parts = [];
const MAX = 420;

export function clearParticles() {
  parts.length = 0;
}

function add(p) {
  if (parts.length >= MAX) parts.shift();
  parts.push(p);
}

export function chips(x, y, dirX, dirY, n) {
  for (let i = 0; i < (n || 5); i++) {
    const a = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 1.9;
    const s = 26 + Math.random() * 52;
    add({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 26,
      g: 210, life: 0.45 + Math.random() * 0.4, t: 0,
      col: Math.random() < 0.5 ? PAL.woodPale : PAL.woodLight,
      size: 1, shrink: false,
    });
  }
}

export function leaves(x, y, n) {
  for (let i = 0; i < (n || 8); i++) {
    add({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 34,
      vy: -14 - Math.random() * 22,
      g: 44, life: 0.8 + Math.random() * 0.7, t: 0,
      col: Math.random() < 0.5 ? '#43844a' : '#2f6435',
      size: 1, shrink: false, flutter: true,
    });
  }
}

export function sparks(x, y, n) {
  for (let i = 0; i < (n || 8); i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
    const s = 18 + Math.random() * 46;
    add({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      g: 40, life: 0.35 + Math.random() * 0.5, t: 0,
      col: PAL.fire[(Math.random() * 3) | 0],
      size: 1, shrink: false,
    });
  }
}

export function smoke(x, y, n) {
  for (let i = 0; i < (n || 3); i++) {
    add({
      x: x + (Math.random() - 0.5) * 5,
      y,
      vx: (Math.random() - 0.5) * 9,
      vy: -12 - Math.random() * 16,
      g: -5, life: 0.9 + Math.random() * 1.1, t: 0,
      col: PAL.smoke[(Math.random() * 3) | 0],
      size: 1 + ((Math.random() * 2) | 0), shrink: true, fade: true,
    });
  }
}

export function dust(x, y, n) {
  for (let i = 0; i < (n || 6); i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 12 + Math.random() * 34;
    add({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s * 0.45,
      g: 8, life: 0.3 + Math.random() * 0.35, t: 0,
      col: '#8a7c62', size: 1, shrink: false, fade: true,
    });
  }
}

export function blood(x, y, col) {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
    const s = 20 + Math.random() * 44;
    add({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      g: 190, life: 0.3 + Math.random() * 0.3, t: 0,
      col, size: 1, shrink: false,
    });
  }
}

export function updateParticles(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.t += dt;
    if (p.t >= p.life) { parts.splice(i, 1); continue; }
    if (p.flutter) p.vx += Math.sin(p.t * 12 + p.y) * 24 * dt;
    p.vy += p.g * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

export function drawParticles(c) {
  for (const p of parts) {
    const k = 1 - p.t / p.life;
    if (p.fade) c.globalAlpha = Math.max(0, Math.min(1, k * 1.4));
    const s = p.shrink ? Math.max(1, Math.round(p.size * k)) : p.size;
    c.fillStyle = p.col;
    c.fillRect(Math.round(p.x), Math.round(p.y), s, s);
    if (p.fade) c.globalAlpha = 1;
  }
}
