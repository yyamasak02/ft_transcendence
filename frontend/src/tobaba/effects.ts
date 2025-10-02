// src/effects.ts

import { canvas, ctx } from './data';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    gravity?: number;
    alpha?: number;
}

interface Effect {
    id: string;
    particles: Particle[];
    startTime: number;
    duration: number;
    type: 'goal' | 'shot' | 'fastReturn';
    isActive: boolean;
}

let effects: Effect[] = [];
let effectIdCounter = 0;
let currentTime = 0;

export function updateEffects(gameTime: number) {
    currentTime = gameTime;
    
    effects = effects.filter(effect => {
        if (gameTime - effect.startTime > effect.duration) {
            return false;
        }
        
        effect.particles = effect.particles.filter(particle => {
            particle.life -= 16;
            
            if (particle.life <= 0) {
                return false;
            }
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }
            
            if (particle.alpha !== undefined) {
                particle.alpha = particle.life / particle.maxLife;
            }
            
            if (particle.x < -50 || particle.x > canvas.width + 50 || 
                particle.y < -50 || particle.y > canvas.height + 50) {
                return false;
            }
            
            return true;
        });
        
        return effect.particles.length > 0;
    });
}

export function renderEffects() {
    effects.forEach(effect => {
        effect.particles.forEach(particle => {
            const alpha = particle.alpha !== undefined ? particle.alpha : particle.life / particle.maxLife;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            switch (effect.type) {
                case 'goal':
                    renderGoalParticle(particle);
                    break;
                case 'shot':
                    renderShotParticle(particle);
                    break;
                case 'fastReturn':
                    renderFastReturnParticle(particle);
                    break;
            }
            
            ctx.restore();
        });
    });
}

function renderGoalParticle(particle: Particle) {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 10;
    ctx.shadowColor = particle.color;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function renderShotParticle(particle: Particle) {
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = particle.size;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(particle.x - particle.vx * 2, particle.y - particle.vy * 2);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = particle.color;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function renderFastReturnParticle(particle: Particle) {
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 8;
    ctx.shadowColor = particle.color;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

export function createGoalEffect(x: number, y: number) {
    const particles: Particle[] = [];
    const particleCount = 30;
    const colors = [
        '#FFD700', '#FFA500', '#FF4500', '#FF6347', 
        '#00BFFF', '#1E90FF', '#4169E1', '#0000FF',
        '#FF69B4', '#32CD32', '#9370DB', '#FF1493',
        '#00FF7F', '#FF8C00', '#DC143C', '#00CED1'
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 3 + Math.random() * 5;
        const size = 3 + Math.random() * 5;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1000 + Math.random() * 500,
            maxLife: 1000 + Math.random() * 500,
            size: size,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.1,
            alpha: 1
        });
    }
    
    effects.push({
        id: `goal_${effectIdCounter++}`,
        particles: particles,
        startTime: currentTime,
        duration: 2000,
        type: 'goal',
        isActive: true
    });
}

export function createShotEffect(ballX: number, ballY: number) {
    const particles: Particle[] = [];
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 40;
        const startX = ballX + Math.cos(angle) * distance;
        const startY = ballY + Math.sin(angle) * distance;
        
        particles.push({
            x: startX,
            y: startY,
            vx: (ballX - startX) * 0.1,
            vy: (ballY - startY) * 0.1,
            life: 500 + Math.random() * 300,
            maxLife: 500 + Math.random() * 300,
            size: 2 + Math.random() * 3,
            color: '#00FFFF',
            alpha: 1
        });
    }
    
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 8 + Math.random() * 4;
        
        particles.push({
            x: ballX,
            y: ballY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 300 + Math.random() * 200,
            maxLife: 300 + Math.random() * 200,
            size: 3 + Math.random() * 2,
            color: '#FFFF00',
            alpha: 1
        });
    }
    
    effects.push({
        id: `shot_${effectIdCounter++}`,
        particles: particles,
        startTime: currentTime,
        duration: 1000,
        type: 'shot',
        isActive: true
    });
}

export function createFastReturnEffect(x: number, y: number, power: number) {
    const particles: Particle[] = [];
    const ringCount = Math.floor(power * 3);
    
    for (let ring = 0; ring < ringCount; ring++) {
        const delay = ring * 100;
        
        particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 800 - delay,
            maxLife: 800 - delay,
            size: 10 + ring * 15,
            color: '#FF0000',
            alpha: 1
        });
    }
    
    const sparkCount = Math.floor(power * 10);
    for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 400 + Math.random() * 300,
            maxLife: 400 + Math.random() * 300,
            size: 1 + Math.random() * 2,
            color: '#FFFF00',
            alpha: 1
        });
    }
    
    effects.push({
        id: `fastReturn_${effectIdCounter++}`,
        particles: particles,
        startTime: currentTime,
        duration: 1200,
        type: 'fastReturn',
        isActive: true
    });
}

export function createReturnEffect(x: number, y: number) {
    const particles: Particle[] = [];
    
    for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 400 + Math.random() * 300,
            maxLife: 400 + Math.random() * 300,
            size: 1 + Math.random() * 2,
            color: '#FFFF00',
            alpha: 1
        });
    }
    
    effects.push({
        id: `fastReturn_${effectIdCounter++}`,
        particles: particles,
        startTime: currentTime,
        duration: 1200,
        type: 'fastReturn',
        isActive: true
    });
}

let screenShake = {
    intensity: 0,
    duration: 0,
    startTime: 0
};

export function createScreenShake(intensity: number, duration: number) {
    screenShake = {
        intensity: intensity,
        duration: duration,
        startTime: currentTime
    };
}

export function resetScreenShake() {
    screenShake = {
        intensity: 0,
        duration: 0,
        startTime: 0
    };
}

export function applyScreenShake() {
    if (screenShake.duration <= 0) return { x: 0, y: 0 };
    
    const elapsed = currentTime - screenShake.startTime;
    if (elapsed >= screenShake.duration) {
        screenShake.duration = 0;
        return { x: 0, y: 0 };
    }
    
    const progress = elapsed / screenShake.duration;
    const currentIntensity = screenShake.intensity * (1 - progress);
    
    return {
        x: (Math.random() - 0.5) * currentIntensity,
        y: (Math.random() - 0.5) * currentIntensity
    };
}

export function createFireworkEffect(x: number, y: number) {
    const particles: Particle[] = [];
    const particleCount = 40;
    const colors = [
        '#FFD700', '#FFA500', '#FF4500', '#FF6347', 
        '#00BFFF', '#1E90FF', '#4169E1', '#0000FF',
        '#FF69B4', '#32CD32', '#9370DB', '#FF1493',
        '#00FF7F', '#FF8C00', '#DC143C', '#00CED1'
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
        const speed = 4 + Math.random() * 6;
        const size = 2 + Math.random() * 4;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1200 + Math.random() * 600,
            maxLife: 1200 + Math.random() * 600,
            size: size,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.15,
            alpha: 1
        });
    }
    
    effects.push({
        id: `firework_${effectIdCounter++}`,
        particles: particles,
        startTime: currentTime,
        duration: 2500,
        type: 'goal',
        isActive: true
    });
}