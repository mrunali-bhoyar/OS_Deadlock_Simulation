# 🖥️ DeadlockOS PRO: Deadlock Analysis & Intelligent Resource Allocation Dashboard

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/Tests-19%20Passed-10B981?logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, fully interactive Operating Systems simulation dashboard built for comprehensive deadlock analysis, avoidance, detection, prevention, and resource allocation.

Designed for college academic evaluation, live viva defense, and empirical verification, this platform implements classical operating systems algorithms purely client-side with dynamic mathematical modeling—no hardcoded or static outputs.

---

## 🌟 Key Features & Modules

### 1. 📊 Operational Overview Dashboard
* **Real-Time System Telemetry**: Live visualization of system safety state, process status counts, resource utilization percentages, and allocation distribution.
* **Audit Transaction Log**: Real-time logging of all simulated resource allocation requests with timestamped kernel verdicts (`GRANTED`, `WAITING`, `DENIED`).

### 2. ⚙️ Dynamic System Configuration
* Fully customizable process count ($n$) and resource types ($m$).
* Interactive matrix editors for **Allocation**, **Maximum Claim**, and **Available** vectors.
* Real-time boundary validation checking for:
  * Allocation $\le$ Maximum claim constraint violations.
  * Negative vector/matrix instances.
  * Vector and matrix dimension consistency.
* Quick-load scenarios including the **Silberschatz Classic Safe State** and **Dedicated Deadlock Scenario**.

### 3. 🛡️ Banker's Algorithm (Deadlock Avoidance)
* Implements Dijkstra's Banker's Algorithm for multiple resource types.
* **Dynamic Need Matrix Calculation**: Automatically computes $\text{Need}[i][j] = \text{Maximum}[i][j] - \text{Allocation}[i][j]$.
* **Step-by-Step Interactive Trace**:
  * Step-by-step playback with visual execution pointer.
  * Shows intermediate `Work`, `Allocation`, and `Finish` vectors per step.
  * Clear mathematical proofs of safe execution sequences (e.g., $\langle P_1 \to P_3 \to P_4 \to P_0 \to P_2 \rangle$).

### 4. ⚡ Live Resource Request Simulator
* Simulates dynamic runtime resource allocation requests:
  1. **Check A**: Is $\text{Request}_i \le \text{Need}_i$? (Exceeding Maximum Claim check).
  2. **Check B**: Is $\text{Request}_i \le \text{Available}$? (Availability check).
  3. **Hypothetical State Transition**: Temporarily allocates resources to $P_i$.
  4. **Safety Evaluation**: Runs Banker's safety test on the prospective state.
  5. **Atomic Commit / Rollback**: If safe, state commits; if unsafe, system performs an exact zero-corruption rollback.
* Includes one-click benchmark presets: Safe Request, Exceeds Available (Wait), and Unsafe Request (Denied & Rolled Back).

### 5. 🔍 Deadlock Detection & Recovery
* Multiple-instance deadlock detection algorithm using available resources and request/allocation matrices.
* Identifies the exact set of deadlocked processes (e.g., $\{P_1, P_2, P_3, P_4\}$).
* **Interactive Process Recovery**: Allows terminating deadlocked processes one by one, immediately reclaiming allocated resources until the cycle breaks.

### 6. 🔒 Deadlock Prevention (Havender's Hierarchical Ordering)
* Enforces Havender's total ordering protocol: resources must be requested strictly in monotonically increasing order of global rank ($R_0 < R_1 < R_2$).
* Mathematically eliminates the **Circular Wait** Coffman condition before requests are submitted.
* Interactive policy tester showing allowed vs. rejected request orders.

### 7. 🕸️ Interactive Resource Allocation Graph (RAG)
* Dynamic SVG graph visualizer rendering Process nodes (circles), Resource nodes (boxes), Claim edges, Assignment edges ($R_j \to P_i$), and Request edges ($P_i \to R_j$).
* Real-time toggle between Safe State and Deadlocked cycle graphs.

### 8. 🧪 Automated Test Lab (TC1 to TC6)
* Automated verification test suite executing 6 formal test cases:
  * **TC1**: Safe State & Need Calculation Verification.
  * **TC2**: Request Exceeds Available Resources (Wait state preservation).
  * **TC3**: Unsafe Request Rejection & Zero-Corruption State Rollback.
  * **TC4**: Multiple-Instance Deadlock Detection & Process Termination Recovery.
  * **TC5**: Havender Hierarchical Ordering (Circular Wait prevention).
  * **TC6**: Boundary Conditions & Corrupted Input Interception.

### 9. 📈 Results & Analytical Synthesis
* Comprehensive Test Verification Matrix with real-time pass/fail indicators.
* One-click **Export to CSV** and **Export to JSON** for academic lab reports.
* Synthesized OS architectural findings and conclusions.

---

## 🏗️ Tech Stack & Architecture

* **Frontend Framework**: React 19 + TypeScript
* **Build Tool & Dev Server**: Vite 8
* **Styling**: Vanilla CSS (Tailored Design System, Light/Dark Modes, Glassmorphism)
* **Icons**: Lucide React
* **Testing Suite**: Vitest (19 Unit Tests, 100% Pass)
* **Execution Model**: Pure Client-Side Computation (Deterministic & Dynamic)

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18.x or later recommended)
* `npm` or `yarn`

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/mrunali-bhoyar/OS_Deadlock_Simulation.git

# 2. Navigate to project directory
cd OS_Deadlock_Simulation

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173/`**

---

## 🧪 Running Unit Tests

Run the Vitest test suite to verify all algorithm mathematical calculations:

```bash
npm test
```

To run once without watch mode:
```bash
npm test -- --run
```

All 19 tests in `src/algorithms/__tests__/algorithms.test.ts` will validate Banker's safety, request evaluation, detection, recovery, and boundary cases.

---

## 📦 Building for Production

Compile TypeScript and build the optimized production bundle:

```bash
npm run build
```

The output files will be created in the `dist/` directory, ready to deploy to any static host.

---

## 🌐 Free 1-Click Deployment

### Deploy with Vercel (Recommended)
1. Go to [Vercel](https://vercel.com/new).
2. Connect your GitHub account and import `mrunali-bhoyar/OS_Deadlock_Simulation`.
3. Default settings (Framework: Vite, Build: `npm run build`, Output: `dist`) will be automatically detected.
4. Click **Deploy**.

### Deploy with Netlify
1. Run `npm run build` locally.
2. Drag and drop the `dist/` folder into [Netlify Drop](https://app.netlify.com/drop).

---

## 📚 Operating Systems Theoretical Basis

1. **Dijkstra's Banker's Algorithm**:
   $$\text{Need}[i][j] = \text{Max}[i][j] - \text{Alloc}[i][j]$$
   $$\text{Condition to proceed: } \text{Need}[i] \le \text{Work}$$
   $$\text{Upon completion: } \text{Work} = \text{Work} + \text{Alloc}[i]$$

2. **The 4 Coffman Conditions for Deadlock**:
   - **Mutual Exclusion**: Non-shareable resource instances.
   - **Hold and Wait**: Process holding resources while requesting others.
   - **No Preemption**: Resources cannot be forcibly revoked.
   - **Circular Wait**: Closed chain of processes waiting for resources held by the next.

3. **Havender's Prevention Principle**:
   - Imposes a linear function $F: R \to \mathbb{N}$. A process holding $R_i$ may only request $R_j$ if $F(R_j) > F(R_i)$, mathematically making circular wait impossible.

---

## 📄 License

This project is licensed under the MIT License — feel free to use and adapt for academic purposes.
