import React from 'react';

interface LogoProps {
    size?: number;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 32, className = "" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} filter transition-all duration-300`}
        >
            <defs>
                <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Base do Ícone (Item de Elite) */}
            <rect width="100" height="100" rx="24" fill="#09090b" />
            <rect x="2" y="2" width="96" height="96" rx="22" stroke="#18181b" strokeWidth="1" />

            {/* O "Double T" Geométrico / Chevron Tático */}
            <g filter="url(#neonGlow)">
                {/* 1º T (Base/Chevron Inferior) - Representa o Grind */}
                <path
                    d="M35 40H65M50 40V70"
                    stroke="#0369a1"
                    strokeWidth="10"
                    strokeLinecap="square"
                    className="opacity-60"
                />

                {/* 2º T (Top/Chevron Superior) - Representa a Missão */}
                <path
                    d="M25 30H75M50 30V60"
                    stroke="url(#glowGradient)"
                    strokeWidth="8"
                    strokeLinecap="square"
                />

                {/* Detalhes de Precisão (Mira Tática) */}
                <path d="M50 20V25" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <path d="M50 75V80" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 50H25" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <path d="M75 50H80" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

                {/* Centro de Foco */}
                <rect x="48" y="48" width="4" height="4" fill="#7dd3fc" transform="rotate(45 50 50)" />
            </g>
        </svg>
    );
};

export default Logo;
