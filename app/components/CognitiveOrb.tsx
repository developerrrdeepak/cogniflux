"use client";

import React, { useEffect, useState } from 'react';

type OrbProps = {
  state: "idle" | "listening" | "processing" | "speaking";
  confusionScore: "low" | "medium" | "high";
  userLevel: "beginner" | "intermediate" | "expert";
};

export default function CognitiveOrb({ state, confusionScore, userLevel }: OrbProps) {
  // Determine base color based on user state/emotion
  const getBaseColor = () => {
    if (confusionScore === "high") return "bg-blue-400"; // Calming Blue
    if (confusionScore === "medium") return "bg-purple-400"; // Balanced Purple
    if (userLevel === "expert") return "bg-orange-400"; // Energetic Orange
    return "bg-cyan-400"; // Default Cyan
  };

  const getGlowColor = () => {
    if (confusionScore === "high") return "shadow-blue-500/50";
    if (confusionScore === "medium") return "shadow-purple-500/50";
    if (userLevel === "expert") return "shadow-orange-500/50";
    return "shadow-cyan-500/50";
  };

  const getAnimation = () => {
    switch (state) {
      case "listening":
        return "animate-pulse scale-110";
      case "processing":
        return "animate-spin-slow duration-3000"; 
      case "speaking":
        return "animate-bounce-slight"; // Custom animation we'd need to define or simulate
      default:
        return "animate-float"; // Gentle floating
    }
  };

  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto my-4 transition-all duration-700">
      {/* Outer Glow Ring */}
      <div className={`absolute w-full h-full rounded-full opacity-20 blur-xl transition-colors duration-700 ${getBaseColor()}`} />
      
      {/* Core Orb */}
      <div 
        className={`relative w-16 h-16 rounded-full shadow-[0_0_40px] transition-all duration-700 ease-in-out
          ${getBaseColor()} 
          ${getGlowColor()}
          ${getAnimation()}
        `}
      >
        {/* Inner Highlight for 3D effect */}
        <div className="absolute top-2 left-3 w-4 h-4 rounded-full bg-white opacity-40 blur-[1px]" />
      </div>

      {/* Status Text */}
      <div className="absolute -bottom-8 text-xs font-medium tracking-widest uppercase text-gray-500 dark:text-gray-400 transition-opacity duration-300">
        {state === "idle" ? "Ready" : state}
      </div>
      
      {/* Dynamic Particles/Rings based on state (Simplified as CSS borders for now) */}
       {state === "processing" && (
         <div className="absolute w-24 h-24 border-t-2 border-r-2 border-white/30 rounded-full animate-spin" />
       )}
    </div>
  );
}
