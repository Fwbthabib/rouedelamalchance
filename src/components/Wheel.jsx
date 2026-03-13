import { useState, useRef, useEffect, useCallback } from 'react';
import { playTick, playWinSound, playSpinSound } from '../hooks/useSounds';
import './Wheel.css';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#A3E4D7', '#FAD7A0',
];

export default function Wheel({ items, onResult, title }) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const animRef = useRef(null);
  const currentRotation = useRef(0);
  const lastTickSlice = useRef(-1);

  const drawWheel = useCallback((rot) => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const arc = (2 * Math.PI) / items.length;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    items.forEach((item, i) => {
      const angle = rot + i * arc;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(16, 200 / items.length)}px 'Nunito', sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      const text = item.length > 20 ? item.slice(0, 18) + '...' : item;
      ctx.fillText(text, radius - 15, 5);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [items]);

  useEffect(() => {
    drawWheel(currentRotation.current);
  }, [drawWheel]);

  function getCurrentSlice(rot) {
    const arc = (2 * Math.PI) / items.length;
    const normalizedRot = ((rot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const pointerAngle = (2 * Math.PI - normalizedRot + Math.PI * 1.5) % (2 * Math.PI);
    return Math.floor(pointerAngle / arc) % items.length;
  }

  function spin() {
    if (spinning || items.length === 0) return;

    setSpinning(true);
    setWinner(null);
    lastTickSlice.current = -1;
    playSpinSound();

    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
    const duration = 4000 + Math.random() * 2000;
    const startTime = performance.now();
    const startRot = currentRotation.current;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const rot = startRot + totalRotation * eased;

      currentRotation.current = rot;
      drawWheel(rot);

      // Tick sound when crossing slice boundary
      const currentSlice = getCurrentSlice(rot);
      if (currentSlice !== lastTickSlice.current) {
        lastTickSlice.current = currentSlice;
        playTick();
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const winnerIndex = getCurrentSlice(rot);
        const result = items[winnerIndex];
        setWinner(result);
        playWinSound();
        if (onResult) onResult(result);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="wheel-container">
      {title && <h3 className="wheel-title">{title}</h3>}
      <div className="wheel-wrapper">
        <div className="wheel-pointer">▼</div>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="wheel-canvas"
        />
      </div>
      <button
        className="btn btn-spin"
        onClick={spin}
        disabled={spinning || items.length === 0}
      >
        {spinning ? '🎰 Ça tourne...' : '🎯 Tourner la roue !'}
      </button>
      {winner && (
        <div className="wheel-result">
          <span className="result-label">Résultat :</span>
          <span className="result-value">{winner}</span>
        </div>
      )}
    </div>
  );
}
