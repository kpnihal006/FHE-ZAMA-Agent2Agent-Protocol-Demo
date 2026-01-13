import { FheValue, EncryptionState, CreditProfile, FheDataType, SimulatedOpResult, PatientVitals } from '../types';

// Deterministic simulation of a ZAMA-like ciphertext format (mock)
export const generateCiphertext = (value: FheDataType): string => {
  const noise = Math.random().toString(36).substring(7);
  let seed = 0;
  if (typeof value === 'number') {
      seed = value;
  } else if (typeof value === 'object' && 'heartRate' in value) {
      const v = value as PatientVitals;
      seed = v.heartRate + v.systolic + v.temperature;
  } else {
      seed = Object.values(value).reduce((a, b) => a + b, 0);
  }
  return `ct_0x${(seed * 1337 + Date.now()).toString(16).slice(-6)}...${noise}`;
};

// Helper to generate a toy LWE example
const generateToyLWE = (message: number, scale: number = 100) => {
    const s = [1, 0, 1, 0]; 
    const a = Array.from({length: 4}, () => Math.floor(Math.random() * 1000));
    const error = Math.floor(Math.random() * 5) + 1; 
    const deltaM = message * scale;
    const dotProduct = a.reduce((sum, val, idx) => sum + val * s[idx], 0);
    const b = dotProduct + deltaM + error;
    
    return { s, a, b, error, dotProduct, deltaM };
};

export const encryptValue = (val: FheDataType): SimulatedOpResult => {
  const encrypted: FheValue = {
    id: crypto.randomUUID(),
    rawValue: val,
    encryptedBlob: generateCiphertext(val),
    state: EncryptionState.ENCRYPTED,
    history: ['Initial Encryption'],
  };

  const isObject = typeof val === 'object';
  const steps: string[] = [];
  
  if (isObject) {
      steps.push(`1. Serialization: Convert Patient Vitals vector to tensor.`);
      steps.push(`2. KeyGen: Generate Secret Key (S) and Cloud Key (CK).`);
      steps.push(`3. Packing: Encrypt multiple vitals into LWE ciphertexts.`);
      steps.push(`4. Noise Addition: Sample Gaussian error for security.`);
      steps.push(`5. Result: Encrypted Vitals Vector ready for transmission.`);
  } else {
      const m = val as number;
      const { s, a, b, error, dotProduct, deltaM } = generateToyLWE(m);
      steps.push(`1. Setup: Define dimension n=4, Modulus q=2^32.`);
      steps.push(`2. Secret Key (s): [${s.join(', ')}] (Only known to Client)`);
      steps.push(`3. Scaling: Map message m=${m} to Torus: Δm = ${m} * 100 = ${deltaM}`);
      steps.push(`4. Random Mask (a): [${a.join(', ')}] (Publicly generated)`);
      steps.push(`5. Compute Inner Product <a, s>: (${a[0]}*${s[0]}) + (${a[1]}*${s[1]}) + (${a[2]}*${s[2]}) + (${a[3]}*${s[3]}) = ${dotProduct}`);
      steps.push(`6. Add Noise (e): Sample Gaussian error e = ${error}`);
      steps.push(`7. Compute Body (b): ${dotProduct} + ${deltaM} + ${error} = ${b}`);
  }
  
  return {
    value: encrypted,
    logDetails: isObject 
        ? `Encrypted Patient Vitals Vector. Each parameter (HR, BP, Temp) is individually encrypted but bundled.`
        : `Encrypted Scalar Value using TFHE scheme.`,
    mathFormula: isObject 
        ? `Ct = Enc(Vitals_Vector, Public_Params)`
        : `Ciphertext = (Mask, (Mask • Secret) + (Message • Scale) + Error)`,
    stepByStepCalculation: steps,
    metrics: {
        "security_level": "128-bit",
        "dimension": isObject ? "n=2048" : "n=1024",
        "noise_variance": "σ² ≈ 2^-25"
    }
  };
};

// Specialist Physician (Agent C) - Enhanced with Neural Network Simulation
export const homomorphicDiagnosis = (a: FheValue): SimulatedOpResult => {
  let newVal = 0;
  let steps: string[] = [];

  if (typeof a.rawValue === 'object' && 'heartRate' in a.rawValue) {
      const v = a.rawValue as PatientVitals;
      
      // Simulation: Weighted Linear Model + Activation
      // Weights: HR (0.2), BP (0.2), Temp (0.3), O2 (0.4), Sev (0.01)
      let score = 0;
      
      // Simple logic to generate a "score" for the demo
      if (v.heartRate > 100 || v.heartRate < 50) score += 20;
      if (v.systolic > 140) score += 20;
      if (v.temperature > 37.5) score += 25;
      if (v.oxygenSat < 95) score += 30;
      score += v.symptomSeverity * 0.3;
      
      newVal = Math.min(99, Math.floor(score));
      
      steps = [
          `1. Input: Encrypted Feature Vector x = [HR, BP, Temp, O2, ...].`,
          `2. Linear Layer: Compute Dot Product Enc(z) = Σ (w_i • Enc(x_i)) + Enc(bias).`,
          `3. Programmable Bootstrapping (PBS): Apply Activation Function φ(z).`,
          `4. Activation: Using lookup table for Sigmoid/ReLU over Torus.`,
          `5. Result: Encrypted Diagnosis Confidence ${newVal}%.`
      ];
  } else {
      newVal = Math.min(99, Math.floor((a.rawValue as number) * 1.5));
      steps = [`1. Input: Scalar`, `2. Op: Linear Eval`, `3. Result: ${newVal}`];
  }

  const result: FheValue = {
    ...a,
    rawValue: newVal,
    encryptedBlob: generateCiphertext(newVal),
    state: EncryptionState.PROCESSED,
    history: [...a.history, 'Specialist Diagnosis (NN)'],
  };

  return {
    value: result,
    logDetails: `Specialist executed an encrypted Neural Network inference layer using Programmable Bootstrapping (PBS).`,
    mathFormula: `y = PBS_ReLU( W • Enc(x) + b )`,
    stepByStepCalculation: steps,
    metrics: {
        "model_type": "FHE-Neural-Net",
        "layers": "1 Linear + 1 PBS",
        "pbs_latency": "420ms"
    }
  };
};

// Medical Lab (Agent D) - Enhanced with Statistical Anomaly Detection
export const homomorphicLabAnalysis = (a: FheValue): SimulatedOpResult => {
  let newVal = 0;
  let steps: string[] = [];

  if (typeof a.rawValue === 'object' && 'heartRate' in a.rawValue) {
      const v = a.rawValue as PatientVitals;
      
      // Simulation: Standard Deviation / Z-Score Analysis
      // Baselines: HR=70, Sys=120, O2=98
      const d_hr = Math.pow(v.heartRate - 70, 2);
      const d_sys = Math.pow(v.systolic - 120, 2);
      const d_o2 = Math.pow(v.oxygenSat - 98, 2) * 5; // Weighted more

      const variance = Math.sqrt(d_hr + d_sys + d_o2);
      newVal = Math.min(100, Math.floor(variance)); // Map to 0-100 scale

      steps = [
        `1. Normalization: Enc(x_norm) = Enc(x) - Enc(μ).`,
        `2. Square Calculation: PBS_Square( Enc(x_norm) ) mapping x -> x².`,
        `3. Accumulation: Σ Enc(x²_i) (Homomorphic Addition).`,
        `4. Thresholding: Compare Enc(Sum) > Enc(Limit).`,
        `5. Result: Encrypted Deviation Score ${newVal}.`
      ];
  } else {
       newVal = Math.min(100, Math.floor((a.rawValue as number) * 1.2));
       steps = [`1. Input: Scalar`, `2. Op: Analysis`, `3. Result: ${newVal}`];
  }

  const result: FheValue = {
    ...a,
    rawValue: newVal,
    encryptedBlob: generateCiphertext(newVal),
    state: EncryptionState.PROCESSED,
    history: [...a.history, 'Lab Analysis (Stats)'],
  };

  return {
    value: result,
    logDetails: `Medical Lab performed homomorphic statistical analysis (Variance Calculation) to detect anomalies.`,
    mathFormula: `σ² = Σ PBS_Square( Enc(x_i) - Enc(μ) )`,
    stepByStepCalculation: steps,
    metrics: {
        "algo": "FHE-Statistical-Analysis",
        "ops": "3x PBS (Squaring)",
        "precision": "6-bit"
    }
  };
};

// Billing (Agent E)
export const homomorphicBilling = (a: FheValue): SimulatedOpResult => {
  // Billing calculates cost based on complexity of data
  let cost = 0;
  if (typeof a.rawValue === 'object') {
     cost = 150 + Math.floor(Math.random() * 50); // Dummy cost calc
  } else {
     cost = 50;
  }
  
  const steps = [
      `1. Input: Encrypted Procedure Codes.`,
      `2. Lookup: Homomorphic Table Lookup (Enc(Code) -> Enc(Cost)).`,
      `3. Sum: Enc(Total) = Enc(Base) + Enc(Extras).`,
      `4. Output: Encrypted Bill Amount $${cost}.`
  ];

  const result: FheValue = {
    ...a,
    rawValue: cost, // Conceptually the cost
    encryptedBlob: generateCiphertext(cost),
    state: EncryptionState.PROCESSED,
    history: [...a.history, 'Billing Generated'],
  };

  return {
    value: result,
    logDetails: `Billing Agent calculated total cost securely. Patient financial info never exposed.`,
    mathFormula: `Bill = Σ FHE_Lookup( Enc(Service_i) )`,
    stepByStepCalculation: steps,
    metrics: {
        "ops": "Table Lookup",
        "execution_time": "0.9s"
    }
  };
};

// Human Doctor (New)
export const humanDoctorReview = (a: FheValue): SimulatedOpResult => {
    // Human doctor reviews the processed result (e.g. Urgency Index) and approves it
    const val = a.rawValue;
    const steps = [
        `1. Receive Encrypted Diagnosis/Lab Results.`,
        `2. Secure Enclave: Decrypt for Human Review (in Trusted Hardware).`,
        `3. Doctor Decision: APPROVE treatment plan.`,
        `4. Output: Re-encrypted Authorization Token.`
    ];

    const result: FheValue = {
        ...a,
        history: [...a.history, 'Human Doctor Approved']
    };

    return {
        value: result,
        logDetails: "Human Doctor reviewed case in Trusted Execution Environment (TEE).",
        mathFormula: "Auth = Sign( Dec(Result) )",
        stepByStepCalculation: steps,
        metrics: {
            "mode": "Hybrid (FHE + TEE)",
            "authority": "Dr. Smith"
        }
    };
};