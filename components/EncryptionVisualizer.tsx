import React, { useEffect, useRef } from 'react';
import { EncryptionState, CreditProfile, FheDataType, PatientVitals } from '../types';
import { FileText, Activity, HeartPulse, Thermometer, AlertTriangle, CheckCircle2, Wind, Droplet } from 'lucide-react';

interface EncryptionVisualizerProps {
  value: FheDataType;
  state: EncryptionState;
  label?: string;
  maxValue?: number;
}

const EncryptionVisualizer: React.FC<EncryptionVisualizerProps> = ({ value, state, label, maxValue = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isNumeric = typeof value === 'number';
  const isVitals = typeof value === 'object' && value !== null && 'heartRate' in value;

  // Helper for Health/Urgency Logic
  const getHealthRating = (score: number) => {
      if (score < 30) return { text: "LOW PRIORITY", color: "text-green-400", bg: "bg-green-500", border: "border-green-500", desc: "Routine" };
      if (score < 60) return { text: "MODERATE", color: "text-yellow-400", bg: "bg-yellow-500", border: "border-yellow-500", desc: "Monitor" };
      if (score < 85) return { text: "HIGH PRIORITY", color: "text-orange-400", bg: "bg-orange-500", border: "border-orange-500", desc: "Urgent" };
      return { text: "CRITICAL", color: "text-red-500", bg: "bg-red-600", border: "border-red-600", desc: "Immediate" };
  };

  useEffect(() => {
    if (state === EncryptionState.ENCRYPTED || state === EncryptionState.PROCESSED) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      
      const boxSize = 4;
      
      for(let x=0; x<w; x+=boxSize) {
        for(let y=0; y<h; y+=boxSize) {
            const seed = (x * 31 + y * 17) % 100;
            const isFilled = Math.random() * 100 > seed;
            
            if (state === EncryptionState.PROCESSED) {
                 ctx.fillStyle = isFilled ? 'rgba(192, 132, 252, 0.6)' : 'transparent'; // Purple
            } else {
                 ctx.fillStyle = isFilled ? 'rgba(96, 165, 250, 0.6)' : 'transparent'; // Blue
            }
            
            if(isFilled) ctx.fillRect(x, y, boxSize-1, boxSize-1);
        }
      }
    }
  }, [value, state]);

  // --- RENDER: PATIENT VITALS (INPUT) ---
  if (isVitals && (state === EncryptionState.PLAINTEXT || state === EncryptionState.DECRYPTED)) {
      const v = value as PatientVitals;
      // We only show this detail if it's NOT the result (Results are usually scalar scores in this demo, but if we decrypt back to this, show it)
      // Actually, for this demo, Input = Vitals, Output = Score.
      // So if we have Vitals object, render the dashboard.
      return (
        <div className="w-full flex flex-col gap-3 animate-in zoom-in-95 duration-500">
             <div className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 grid grid-cols-2 gap-3">
                
                {/* Heart Rate */}
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex items-center gap-2">
                    <div className="p-1.5 bg-red-900/20 rounded text-red-500"><HeartPulse size={14}/></div>
                    <div>
                        <div className="text-[9px] text-neutral-500 font-mono uppercase">Heart Rate</div>
                        <div className="text-sm font-bold text-white">{v.heartRate} <span className="text-[9px] text-neutral-600">BPM</span></div>
                    </div>
                </div>

                {/* Oxygen */}
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex items-center gap-2">
                    <div className="p-1.5 bg-blue-900/20 rounded text-blue-500"><Wind size={14}/></div>
                    <div>
                        <div className="text-[9px] text-neutral-500 font-mono uppercase">SpO2</div>
                        <div className="text-sm font-bold text-white">{v.oxygenSat}%</div>
                    </div>
                </div>

                {/* Temp */}
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex items-center gap-2">
                    <div className="p-1.5 bg-orange-900/20 rounded text-orange-500"><Thermometer size={14}/></div>
                    <div>
                        <div className="text-[9px] text-neutral-500 font-mono uppercase">Temp</div>
                        <div className="text-sm font-bold text-white">{v.temperature}°C</div>
                    </div>
                </div>

                {/* BP */}
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-900/20 rounded text-purple-500"><Activity size={14}/></div>
                    <div>
                        <div className="text-[9px] text-neutral-500 font-mono uppercase">BP</div>
                        <div className="text-sm font-bold text-white">{v.systolic}/{v.diastolic}</div>
                    </div>
                </div>

             </div>
             
             {/* Symptom Severity Bar */}
             <div className="px-1">
                 <div className="flex justify-between text-[9px] text-neutral-500 mb-1 font-mono uppercase">
                     <span>Symptom Severity</span>
                     <span>{v.symptomSeverity}/100</span>
                 </div>
                 <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width: `${v.symptomSeverity}%`}}></div>
                 </div>
             </div>
        </div>
      );
  }

  // --- RENDER: URGENCY INDEX / ANOMALY SCORE (OUTPUT) ---
  if (isNumeric && (label === 'URGENCY INDEX' || label === 'ANOMALY SCORE') && (state === EncryptionState.DECRYPTED || state === EncryptionState.PLAINTEXT)) {
      const score = value as number;
      const rating = getHealthRating(score);
      
      return (
        <div className="w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
             <div className={`w-full bg-neutral-900 border ${rating.border} border-opacity-30 rounded-xl p-5 relative overflow-hidden group shadow-lg`}>
                {/* Background Glow */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 ${rating.bg} blur-[60px] opacity-20`}></div>
                
                <div className="flex justify-between items-start mb-2 relative z-10">
                     <div>
                        <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest mb-1 flex items-center gap-2">
                            {score > 80 ? <AlertTriangle size={12} className={rating.color} /> : <CheckCircle2 size={12} className={rating.color} />}
                            {label}
                        </div>
                        <div className={`text-4xl font-bold ${rating.color} tabular-nums tracking-tighter`}>{score}</div>
                     </div>
                     <div className="text-right">
                        <div className={`text-[10px] font-bold ${rating.color} border border-current px-2 py-1 rounded inline-block bg-black/40 backdrop-blur-md`}>
                            {rating.text}
                        </div>
                        <div className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wide">{rating.desc}</div>
                     </div>
                </div>

                {/* Gauge Bar */}
                <div className="w-full h-4 bg-neutral-950 rounded-full overflow-hidden mt-4 relative border border-neutral-800">
                     <div className="absolute inset-0 flex opacity-20">
                         <div className="w-[33%] bg-green-500 border-r border-black"></div>
                         <div className="w-[33%] bg-yellow-500 border-r border-black"></div>
                         <div className="w-[34%] bg-red-500"></div>
                     </div>
                     <div 
                        className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out ${rating.bg} shadow-[0_0_15px_currentColor]`} 
                        style={{width: `${score}%`}}
                     >
                         <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white opacity-50"></div>
                     </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                    <span className="flex items-center gap-1"><Activity size={10} /> AI Confidence: 99.8%</span>
                    <span>ZAMA-FHE-VERIFIED</span>
                </div>
             </div>
        </div>
      );
  }

  // --- RENDER: GENERIC ENCRYPTED STATE ---
  if (state === EncryptionState.ENCRYPTED || state === EncryptionState.PROCESSED) {
      return (
         <div className="h-40 w-full bg-neutral-950 rounded-xl relative overflow-hidden border border-neutral-800 flex items-center justify-center group shadow-inner">
            <canvas ref={canvasRef} width={300} height={160} className="w-full h-full opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            
            {/* Overlay Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <div className={`p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl ${state === EncryptionState.PROCESSED ? 'text-purple-400 shadow-purple-900/20' : 'text-blue-400 shadow-blue-900/20'}`}>
                    {state === EncryptionState.PROCESSED ? (
                        <Activity size={24} className="animate-pulse" />
                    ) : (
                        <FileText size={24} />
                    )}
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold font-mono text-white tracking-widest">
                        {state === EncryptionState.PROCESSED ? 'COMPUTING...' : 'ENCRYPTED'}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                        {isVitals ? 'Encrypted Vitals Vector' : '1024-bit TFHE Ciphertext'}
                    </span>
                </div>
            </div>
         </div>
      );
  }

  // Fallback
  return <div className="text-xs text-neutral-500">No Visualization</div>;
};

export default EncryptionVisualizer;