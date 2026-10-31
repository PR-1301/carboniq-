import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Target,
  FileText,
  Settings,
  ChevronRight,
  Zap,
  Flame,
  Truck,
  Package,
  Lightbulb,
  Route,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export function EnterpriseDashboard({
  company,
  documents = [],
  activities = [],
  onOpenUpload,
  onNavigateTab,
  onSelectDocument,
  onOpenStatutoryReports,
}) {
  const [selectedPeriod] = useState('Sep 2026');
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [displayEmissions, setDisplayEmissions] = useState(0);

  // Compute live emissions from actual activities if available, else use authoritative baseline
  const hasRealActivities = activities && activities.length > 0;

  const realScope1Kg = activities
    .filter((a) => a.scope === 'SCOPE_1')
    .reduce((sum, a) => sum + (a.carbonEmissionsKg || 0), 0);
  const realScope2Kg = activities
    .filter((a) => a.scope === 'SCOPE_2')
    .reduce((sum, a) => sum + (a.carbonEmissionsKg || 0), 0);
  const realScope3Kg = activities
    .filter((a) => a.scope === 'SCOPE_3')
    .reduce((sum, a) => sum + (a.carbonEmissionsKg || 0), 0);
  const realTotalKg = realScope1Kg + realScope2Kg + realScope3Kg;

  // Values in tonnes CO2e
  const totalEmissionsT = hasRealActivities ? +(realTotalKg / 1000).toFixed(1) : 12.5;
  const scope1T = hasRealActivities ? +(realScope1Kg / 1000).toFixed(1) : 5.6;
  const scope2T = hasRealActivities ? +(realScope2Kg / 1000).toFixed(1) : 3.1;
  const scope3T = hasRealActivities ? +(realScope3Kg / 1000).toFixed(1) : 3.8;

  // Percentages
  const scope1Pct = totalEmissionsT > 0 ? Math.round((scope1T / totalEmissionsT) * 100) : 45;
  const scope2Pct = totalEmissionsT > 0 ? Math.round((scope2T / totalEmissionsT) * 100) : 25;
  const scope3Pct = totalEmissionsT > 0 ? Math.round((scope3T / totalEmissionsT) * 100) : 30;

  // Animated mount trigger & number counter
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 60);

    // Smooth count up animation for Total Emissions
    let startTimestamp = null;
    const duration = 1200;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = +(easeProgress * totalEmissionsT).toFixed(1);
      setDisplayEmissions(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    const animId = window.requestAnimationFrame(step);

    return () => {
      clearTimeout(timer);
      window.cancelAnimationFrame(animId);
    };
  }, [totalEmissionsT]);

  // Categories Breakdown Data
  const categoryData = [
    { name: 'Vehicle Fuel', pct: 45, tonnes: scope1T > 0 ? scope1T : 5.6, color: '#f59e0b' },
    { name: 'Purchased Electricity', pct: 25, tonnes: scope2T > 0 ? scope2T : 3.1, color: '#38bdf8' },
    { name: 'Purchased Materials', pct: 18, tonnes: 2.3, color: '#c084fc' },
    { name: 'Logistics & Transport', pct: 7, tonnes: 0.9, color: '#62dd9e' },
    { name: 'Other Operations', pct: 5, tonnes: 0.6, color: '#94a3b8' },
  ];

  // Trend Data (Last 6 Months trajectory)
  const trendMonths = [
    { month: 'Apr', val: 9.8, x: 30, y: 120 },
    { month: 'May', val: 11.2, x: 90, y: 105 },
    { month: 'Jun', val: 10.4, x: 150, y: 114 },
    { month: 'Jul', val: 9.2, x: 210, y: 128 },
    { month: 'Aug', val: 11.6, x: 270, y: 100 },
    { month: 'Sep', val: totalEmissionsT, x: 330, y: 92 },
  ];

  // Top Emission Sources Ranked
  const topSources = [
    { rank: 1, name: 'Vehicle Fuel', icon: Flame, tonnes: 5.6, pct: 45, color: '#f59e0b' },
    { rank: 2, name: 'Purchased Electricity', icon: Zap, tonnes: 3.1, pct: 25, color: '#38bdf8' },
    { rank: 3, name: 'Raw Materials (Flour, Sugar)', icon: Package, tonnes: 2.3, pct: 18, color: '#c084fc' },
    { rank: 4, name: 'Logistics & Transport', icon: Truck, tonnes: 0.9, pct: 7, color: '#62dd9e' },
    { rank: 5, name: 'Other Facility Utilities', icon: Settings, tonnes: 0.6, pct: 5, color: '#94a3b8' },
  ];

  // Supplier Intelligence
  const supplierIntelligence = [
    {
      name: 'ABC Flour Mills',
      type: 'Supplier-specific data',
      status: 'Participating',
      statusColor: 'bg-[#0f2d1e] text-[#62dd9e] border-[#62dd9e]/40',
      intensity: '0.8 kg CO₂e/kg',
    },
    {
      name: 'Green Sugar Industries',
      type: 'Industry factor fallback',
      status: 'Estimated',
      statusColor: 'bg-[#18283a] text-[#38bdf8] border-[#38bdf8]/40',
      intensity: '1.2 kg CO₂e/kg',
    },
    {
      name: 'PackPro Supplies',
      type: 'Spend-based estimate',
      status: 'Low confidence',
      statusColor: 'bg-[#291e0a] text-[#facc15] border-[#facc15]/40',
      intensity: '0.0005 kg CO₂e/₹',
    },
    {
      name: 'Apex Transport Fleet',
      type: 'Insufficient fuel bilti data',
      status: 'Incomplete',
      statusColor: 'bg-[#2b0c10] text-[#f87171] border-[#f87171]/40',
      intensity: 'Pending OCR',
    },
  ];

  // Recommended Decarbonization Levers
  const recommendedActions = [
    {
      title: 'Improve energy efficiency',
      subtitle: 'Potential reduction: 1.2 t CO₂e (≈ 20%)',
      icon: Lightbulb,
      color: '#b5f568',
      action: 'VIEW_ACTION',
    },
    {
      title: 'Optimise delivery routes',
      subtitle: 'Potential reduction: 0.8 t CO₂e (≈ 15%)',
      icon: Route,
      color: '#38bdf8',
      action: 'VIEW_ACTION',
    },
    {
      title: 'Evaluate sustainable packaging',
      subtitle: 'Potential reduction: 0.5 t CO₂e (≈ 10%)',
      icon: Package,
      color: '#c084fc',
      action: 'VIEW_ACTION',
    },
  ];

  // Generate SVG Donut Path helpers
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  return (
    <div className="space-y-6 animate-page-switch">
      {/* Welcome Hero Bar (Duplicate upload button removed and replaced with Statutory ESG Report CTA & Baseline status) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Welcome back,</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b5f568] via-[#7dd9a3] to-[#62dd9e]">
              {company?.companyName || 'Enterprise Partner'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#9aada2] font-mono mt-1">
            Here's your company's sovereign carbon footprint overview for {selectedPeriod}.
          </p>
        </div>

        {/* Action area: Replaced duplicate upload button with Statutory ESG Report & Live Baseline pill */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0b1b14] border border-[#62dd9e]/25 text-xs font-mono text-[#d8e6de] shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#62dd9e] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#62dd9e]"></span>
            </span>
            <span className="text-[10px] text-[#9aada2]">Baseline:</span>
            <span className="text-[#b5f568] font-semibold text-[11px]">CEA v20.0</span>
          </div>

          <button
            type="button"
            onClick={onOpenStatutoryReports}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#122e1f] text-[#b5f568] border border-[#b5f568]/40 hover:bg-[#163825] hover:shadow-[0_0_20px_rgba(181,245,104,0.3)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            title="Generate Statutory SEBI BRSR and EU CBAM Disclosures"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#b5f568]" />
            <span>Generate ESG Report</span>
          </button>
        </div>
      </div>

      {/* Row 1: Top 4 KPI Metric Cards with Staggered Entrance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Emissions */}
        <div className="telemetry-card p-5 rounded-2xl border border-[#b4ffcd]/18 bg-[#0b1b14]/90 backdrop-blur-xl relative overflow-hidden group animate-kpi-enter-1">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b5f568] to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aada2] block">
                Total Emissions
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  {displayEmissions}
                </span>
                <span className="text-xs font-mono font-bold text-[#b5f568]">t CO₂e</span>
              </div>
              <div className="flex items-center space-x-1 text-[11px] font-mono text-[#62dd9e] mt-2">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>&darr; 12% vs baseline</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#122e1f] border border-[#b5f568]/40 flex items-center justify-center text-[#b5f568] shadow-[0_0_20px_rgba(181,245,104,0.25)] group-hover:scale-110 transition-transform">
              <Leaf className="w-6 h-6 text-[#b5f568]" />
            </div>
          </div>
        </div>

        {/* Card 2: Scope 1 */}
        <div className="telemetry-card p-5 rounded-2xl border border-amber-500/25 bg-[#0b1b14]/90 backdrop-blur-xl relative overflow-hidden group animate-kpi-enter-2">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aada2] block">
                Scope 1 (Direct Fuel)
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  {scope1T}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">t CO₂e</span>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-24 h-1.5 rounded-full bg-[#142318] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000 ease-out"
                    style={{ width: isAnimated ? `${scope1Pct}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300">{scope1Pct}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#2b1808] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Card 3: Scope 2 */}
        <div className="telemetry-card p-5 rounded-2xl border border-sky-500/25 bg-[#0b1b14]/90 backdrop-blur-xl relative overflow-hidden group animate-kpi-enter-3">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aada2] block">
                Scope 2 (Electricity)
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  {scope2T}
                </span>
                <span className="text-xs font-mono font-bold text-sky-400">t CO₂e</span>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-24 h-1.5 rounded-full bg-[#142318] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: isAnimated ? `${scope2Pct}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-300">{scope2Pct}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#091e2b] border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-sky-400" />
            </div>
          </div>
        </div>

        {/* Card 4: Scope 3 */}
        <div className="telemetry-card p-5 rounded-2xl border border-purple-500/25 bg-[#0b1b14]/90 backdrop-blur-xl relative overflow-hidden group animate-kpi-enter-4">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aada2] block">
                Scope 3 (Supply Chain)
              </span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-3xl font-black font-mono text-white tracking-tight">
                  {scope3T}
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">t CO₂e</span>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-24 h-1.5 rounded-full bg-[#142318] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-400 to-violet-500 transition-all duration-1000 ease-out"
                    style={{ width: isAnimated ? `${scope3Pct}%` : '0%' }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-300">{scope3Pct}%</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#1e132b] border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.25)] group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Middle Analytics Row (Breakdown Donut, Emissions Trend Area, Top Sources) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Col 1: Emissions Breakdown (4 cols) */}
        <div className="lg:col-span-4 telemetry-card p-5 sm:p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 backdrop-blur-xl flex flex-col justify-between animate-stagger-2">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">Emissions Breakdown</h2>
              <div className="px-2.5 py-1 rounded-lg bg-[#040a08] border border-white/[0.1] text-[10px] font-mono text-[#9aada2]">
                By Category
              </div>
            </div>

            {/* Interactive SVG Donut Chart with Sweep Animation */}
            <div className="flex items-center justify-center py-6 relative">
              <svg className="w-44 h-44 -rotate-90 transform animate-donut-enter" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={donutRadius} fill="none" stroke="#040a08" strokeWidth="22" />
                {categoryData.map((cat, idx) => {
                  const targetDash = (cat.pct / 100) * donutCircumference;
                  const dashLength = isAnimated ? targetDash : 0;
                  const currentOffset = accumulatedOffset;
                  accumulatedOffset += targetDash;
                  return (
                    <circle
                      key={cat.name}
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="none"
                      stroke={cat.color}
                      strokeWidth={hoveredSlice === idx ? '26' : '22'}
                      strokeDasharray={`${dashLength} ${donutCircumference}`}
                      strokeDashoffset={-currentOffset}
                      style={{
                        transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.25s ease',
                        transitionDelay: `${idx * 100}ms`,
                      }}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(idx)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Cutout Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black font-mono text-white tracking-tight">
                  {hoveredSlice !== null ? categoryData[hoveredSlice].tonnes : displayEmissions}
                </span>
                <span className="text-[10px] font-mono text-[#b5f568] font-bold">
                  {hoveredSlice !== null ? categoryData[hoveredSlice].name : 't CO₂e Total'}
                </span>
              </div>
            </div>

            {/* Category Legend List */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              {categoryData.map((cat, idx) => (
                <div
                  key={cat.name}
                  onMouseEnter={() => setHoveredSlice(idx)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`flex items-center justify-between text-xs font-mono p-1.5 rounded-lg transition cursor-pointer ${
                    hoveredSlice === idx ? 'bg-white/[0.06]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-[#d8e6de] text-[11px] truncate max-w-[140px]">{cat.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <span className="text-white font-bold text-[11px]">{cat.pct}%</span>
                    <span className="text-[#9aada2] text-[11px]">{cat.tonnes} t</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: Emissions Trend Area Chart with Drawing Line Animation (4 cols) */}
        <div className="lg:col-span-4 telemetry-card p-5 sm:p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 backdrop-blur-xl flex flex-col justify-between animate-stagger-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">Emissions Trend</h2>
              <div className="px-2.5 py-1 rounded-lg bg-[#040a08] border border-white/[0.1] text-[10px] font-mono text-[#9aada2]">
                Monthly
              </div>
            </div>

            <div className="pt-3">
              <span className="text-[10px] font-mono text-[#9aada2] block">Trajectory (t CO₂e)</span>

              {/* Animated SVG Area Chart */}
              <div className="py-4">
                <svg className="w-full h-44 overflow-visible" viewBox="0 0 360 160">
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#62dd9e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#62dd9e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="20" y1="40" x2="340" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="20" y1="80" x2="340" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <line x1="20" y1="120" x2="340" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <path
                    className={isAnimated ? 'animate-area-fade' : 'opacity-0'}
                    d="M 30,120 C 60,110 70,105 90,105 C 110,105 130,114 150,114 C 170,114 190,128 210,128 C 230,128 250,100 270,100 C 290,100 310,92 330,92 L 330,150 L 30,150 Z"
                    fill="url(#trendGradient)"
                  />

                  {/* Animated Stroke line */}
                  <path
                    className={isAnimated ? 'animate-line-draw' : 'opacity-0'}
                    d="M 30,120 C 60,110 70,105 90,105 C 110,105 130,114 150,114 C 170,114 190,128 210,128 C 230,128 250,100 270,100 C 290,100 310,92 330,92"
                    fill="none"
                    stroke="#62dd9e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Animated Trajectory Nodes */}
                  {trendMonths.map((p, i) => (
                    <g
                      key={p.month}
                      className={isAnimated ? 'animate-node-pop' : 'opacity-0'}
                      style={{ animationDelay: `${400 + i * 130}ms` }}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={i === trendMonths.length - 1 ? 5 : 3.5}
                        fill={i === trendMonths.length - 1 ? '#b5f568' : '#06110d'}
                        stroke="#62dd9e"
                        strokeWidth="2"
                      />
                      <text
                        x={p.x}
                        y="155"
                        textAnchor="middle"
                        fill="#71857c"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {p.month}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-3 border-t border-white/[0.06]">
                <span className="text-[#9aada2]">Current Month Trajectory:</span>
                <span className="text-[#b5f568] font-bold px-2 py-0.5 rounded bg-[#122e1f] border border-[#b5f568]/40">
                  {displayEmissions} t CO₂e
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Top Emission Sources Ranked with Animated Expansion Bars (4 cols) */}
        <div className="lg:col-span-4 telemetry-card p-5 sm:p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 backdrop-blur-xl flex flex-col justify-between animate-stagger-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">Top Emission Sources</h2>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('ACTIVITIES')}
                className="text-[#b5f568] hover:underline flex items-center space-x-1 text-xs font-mono cursor-pointer"
              >
                <span>Inspect</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 pt-4">
              {topSources.map((source, idx) => {
                const IconComponent = source.icon;
                return (
                  <div key={source.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2 truncate max-w-[70%]">
                        <span className="w-5 h-5 rounded-full bg-[#121e1a] border border-white/[0.1] text-slate-400 text-[10px] flex items-center justify-center shrink-0">
                          {source.rank}
                        </span>
                        <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: source.color }} />
                        <span className="text-white text-[11px] truncate">{source.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[#d8e6de] font-semibold text-[11px]">{source.tonnes} t</span>
                        <span className="text-[#9aada2] text-[10px] w-7 text-right">{source.pct}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#040a08] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: isAnimated ? `${source.pct}%` : '0%',
                          backgroundColor: source.color,
                          transitionDelay: `${300 + idx * 100}ms`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Bottom Actionable Row (Recent Documents, Supplier Intelligence, Recommended Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Col 1: Recent Documents (4 cols) */}
        <div className="lg:col-span-4 telemetry-card p-5 sm:p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 backdrop-blur-xl flex flex-col justify-between animate-stagger-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">Recent Ingested Records</h2>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('DOCUMENTS')}
                className="text-[#b5f568] hover:underline text-xs font-mono cursor-pointer"
              >
                View Registry
              </button>
            </div>

            <div className="space-y-3 pt-3">
              {documents.length > 0 ? (
                documents.slice(0, 4).map((doc) => (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => onSelectDocument && onSelectDocument(doc)}
                    className="w-full text-left p-3 rounded-xl bg-[#040a08]/90 border border-white/[0.08] hover:border-[#62dd9e]/40 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5 truncate max-w-[70%]">
                      <div className="p-2 rounded-lg bg-[#121e1a] text-[#b5f568] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-mono text-white truncate font-medium group-hover:text-[#b5f568]">
                          {doc.originalFileName}
                        </div>
                        <div className="text-[10px] font-mono text-[#9aada2] mt-0.5">
                          {doc.extractedFields?.category || 'Utility Record'} &bull;{' '}
                          {doc.extractedFields?.quantity ? `${doc.extractedFields.quantity} ${doc.extractedFields.unit || ''}` : 'Pending OCR'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        doc.reviewStatus === 'APPROVED'
                          ? 'bg-[#0f2d1e] text-[#62dd9e]'
                          : 'bg-[#291e0a] text-[#facc15]'
                      }`}
                    >
                      {doc.reviewStatus === 'APPROVED' ? 'Verified' : 'Extracted'}
                    </span>
                  </button>
                ))
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#040a08]/90 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#121e1a] text-[#b5f568]">
                        <Zap className="w-4 h-4 text-[#38bdf8]" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-white">Electricity_Bill_Sep2026.pdf</div>
                        <div className="text-[10px] font-mono text-[#9aada2]">Electricity &bull; 2,450 kWh</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0f2d1e] text-[#62dd9e]">
                      Extracted
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#040a08]/90 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#121e1a] text-amber-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-white">Fuel_Receipt_TN01AB1234.jpg</div>
                        <div className="text-[10px] font-mono text-[#9aada2]">Diesel &bull; 120 L</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0f2d1e] text-[#b5f568]">
                      Verified
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#040a08]/90 border border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#121e1a] text-purple-400">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-white">Purchase_Invoice_Flour.pdf</div>
                        <div className="text-[10px] font-mono text-[#9aada2]">Raw Material &bull; 1,000 kg</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0f2d1e] text-[#62dd9e]">
                      Extracted
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 2: Supplier Intelligence (4 cols) */}
        <div className="lg:col-span-4 telemetry-card p-5 sm:p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 backdrop-blur-xl flex flex-col justify-between animate-stagger-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">Supplier Intelligence</h2>
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('ACTIVITIES')}
                className="text-[#b5f568] hover:underline text-xs font-mono cursor-pointer"
              >
                Scope 3 Ledger
              </button>
            </div>

            <div className="space-y-3 pt-3">
              {supplierIntelligence.map((supp) => (
                <div
                  key={supp.name}
                  className="p-3 rounded-xl bg-[#040a08]/90 border border-white/[0.08] flex items-center justify-between"
                >
                  <div className="truncate max-w-[65%]">
                    <div className="text-xs font-mono text-white font-medium truncate">{supp.name}</div>
                    <div className="text-[10px] font-mono text-[#9aada2]">{supp.type}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${supp.statusColor}`}>
                      {supp.status}
                    </span>
                    <div className="text-[10px] font-mono text-[#7dd9a3] mt-1">{supp.intensity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Recommended Actions (4 cols) */}
        <div className="lg:col-span-4 telemetry-card p-5 sm:p-6 rounded-2xl border border-[#b4ffcd]/15 bg-[#0b1b14]/90 backdrop-blur-xl flex flex-col justify-between animate-stagger-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-bold text-white font-mono tracking-tight">Recommended Actions</h2>
              <button
                type="button"
                onClick={onOpenStatutoryReports}
                className="text-[#b5f568] hover:underline text-xs font-mono cursor-pointer"
              >
                Statutory Reports
              </button>
            </div>

            <div className="space-y-3 pt-3">
              {recommendedActions.map((rec) => {
                const IconComp = rec.icon;
                return (
                  <button
                    key={rec.title}
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab('ACTIVITIES')}
                    className="w-full text-left p-3.5 rounded-xl bg-[#040a08]/90 border border-white/[0.08] hover:border-[#b5f568]/40 transition flex items-center justify-between group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center space-x-3 truncate max-w-[85%]">
                      <div
                        className="p-2.5 rounded-xl bg-[#121e1a] border border-white/[0.08] shrink-0"
                        style={{ color: rec.color }}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-mono text-white font-bold group-hover:text-[#b5f568] truncate">
                          {rec.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#9aada2] mt-0.5 truncate">
                          {rec.subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9aada2] group-hover:text-[#b5f568] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnterpriseDashboard;
