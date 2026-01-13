import React, { useEffect, useRef } from 'react';
import { LogEntry, AgentRole } from '../types';
import { Terminal, Zap, Sigma, Calculator } from 'lucide-react';

interface ProtocolLogProps {
  logs: LogEntry[];
  aiAnalysis?: any; 
  analyzing?: boolean;
}

const ProtocolLog: React.FC<ProtocolLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getAgentColor = (role: AgentRole) => {
      switch(role) {
          case AgentRole.PATIENT: return 'text-blue-400';
          case AgentRole.GENERAL_DOCTOR: return 'text-emerald-400';
          case AgentRole.SPECIALIST: return 'text-purple-400';
          case AgentRole.MEDICAL_LAB: return 'text-yellow-400';
          case AgentRole.BILLING: return 'text-teal-400';
          case AgentRole.HUMAN_DOCTOR: return 'text-red-400';
          default: return 'text-neutral-400';
      }
  };

  const getAgentName = (role: AgentRole) => {
      switch(role) {
          case AgentRole.PATIENT: return 'PATIENT (A)';
          case AgentRole.GENERAL_DOCTOR: return 'GEN. DOCTOR (B)';
          case AgentRole.SPECIALIST: return 'SPECIALIST (C)';
          case AgentRole.MEDICAL_LAB: return 'MEDICAL LAB (D)';
          case AgentRole.BILLING: return 'BILLING (E)';
          case AgentRole.HUMAN_DOCTOR: return 'HUMAN DOCTOR';
          default: return role;
      }
  };

  return (
    <div className="flex flex-col h-full bg-black border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-neutral-400">
          <Terminal size={16} />
          <span className="text-xs font-mono font-bold uppercase">Hospital Audit Log</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded text-neutral-500">TFHE / MATH PROOF</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-6 bg-neutral-950">
        {logs.length === 0 && (
            <div className="text-neutral-600 italic text-center mt-10">Waiting for patient admission...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300 group border-b border-neutral-900 pb-4 last:border-0">
            <span className="text-neutral-600 shrink-0">[{log.timestamp.split('T')[1].slice(0, 8)}]</span>
            <div className="flex flex-col w-full">
                {/* Header */}
                <div className="flex items-baseline justify-between">
                    <span className={`font-bold text-sm ${getAgentColor(log.source)}`}>
                        {getAgentName(log.source)}
                    </span>
                    <span className="text-[10px] text-neutral-600 font-mono tracking-widest">{log.action}</span>
                </div>
                
                <span className="text-neutral-400 mt-1 block leading-relaxed">{log.details}</span>
                
                {/* Math Formula Block */}
                {log.mathFormula && (
                    <div className="mt-3 p-3 bg-[#0d0d0d] border-l-2 border-green-500/50 rounded-r-md">
                        <div className="flex items-center gap-2 text-[10px] text-green-600/80 mb-1 font-bold">
                            <Sigma size={10} /> CRYPTOGRAPHIC PRIMITIVE
                        </div>
                        <code className="text-[11px] text-green-400 font-mono whitespace-pre-wrap block">
                            {log.mathFormula}
                        </code>
                    </div>
                )}

                {/* Step-by-Step Calculation */}
                {log.stepByStepCalculation && log.stepByStepCalculation.length > 0 && (
                    <div className="mt-3 bg-neutral-900/30 rounded-lg p-3 border border-neutral-800/50">
                        <div className="flex items-center gap-2 text-[10px] text-blue-400/80 mb-2 font-bold uppercase tracking-wider">
                            <Calculator size={10} /> Step-by-Step Verification
                        </div>
                        <div className="space-y-1.5">
                            {log.stepByStepCalculation.map((step, idx) => (
                                <div key={idx} className="flex gap-2 text-[10px] text-neutral-500">
                                    <span className="text-neutral-700 select-none">{(idx + 1).toString().padStart(2, '0')}</span>
                                    <span className="font-mono">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Benchmarking Metrics Display */}
                {log.metrics && (
                   <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(log.metrics).map(([key, val]) => (
                         <div key={key} className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px]">
                            <Zap size={8} className="text-orange-400" />
                            <span className="text-neutral-500 uppercase">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-neutral-300 font-mono">{val}</span>
                         </div>
                      ))}
                   </div>
                )}
                
                {log.hash && <span className="text-neutral-800 text-[9px] mt-2 block break-all font-sans">hash: {log.hash}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ProtocolLog;