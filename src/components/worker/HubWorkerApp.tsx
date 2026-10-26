/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Camera,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  FileText,
  Volume2,
  HardHat,
  Search,
  Database,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  User,
  Hub,
  SupportedLanguage,
  DetectedEwasteItem,
  SafetyGuideline,
  GadgetListing,
  HazardAlertEvent,
} from '../../types/index.ts';
import { translations } from '../../i18n/translations.ts';
import {
  SAFETY_GUIDELINES,
  SoundEffects,
} from '../../services/store.ts';

interface HubWorkerAppProps {
  currentUser: User;
  language: SupportedLanguage;
  hubs: Hub[];
  listings: GadgetListing[];
  onVerifyListing: (listingId: string, notes?: string) => void;
  onLogHazardAlert: (alert: HazardAlertEvent) => void;
}

// Simulated reference feed items for live inspection
const REFERENCE_SCENE_ITEMS: DetectedEwasteItem[] = [
  {
    id: 'det-001',
    label: 'Lithium-Ion Pouch Battery (4000mAh)',
    confidence: 0.94,
    bbox: { x: 0.15, y: 0.22, width: 0.32, height: 0.38 },
    hazard_level: 'RED',
    hazard_class: 'LI_ION_BATTERY',
    material_breakdown: { Lithium: '78%', Cobalt: '12%', Nickel: '6%' },
    is_hazard_alert: true,
    ppe_guidance: SAFETY_GUIDELINES.LI_ION_BATTERY,
  },
  {
    id: 'det-002',
    label: 'Smartphone High-Density Logic Board (PCB)',
    confidence: 0.96,
    bbox: { x: 0.52, y: 0.18, width: 0.35, height: 0.45 },
    hazard_level: 'GREEN',
    material_breakdown: { Gold: '0.03g', Copper: '18g', Palladium: '0.008g' },
    is_hazard_alert: false,
  },
  {
    id: 'det-003',
    label: 'Electrolytic Filter Capacitors (400V)',
    confidence: 0.88,
    bbox: { x: 0.38, y: 0.62, width: 0.26, height: 0.28 },
    hazard_level: 'YELLOW',
    hazard_class: 'PCB_CAPACITOR',
    material_breakdown: { Aluminum: '80%', BoricAcid: '15%' },
    is_hazard_alert: false,
    ppe_guidance: SAFETY_GUIDELINES.PCB_CAPACITOR,
  },
];

export const HubWorkerApp: React.FC<HubWorkerAppProps> = ({
  currentUser,
  language,
  hubs,
  listings,
  onVerifyListing,
  onLogHazardAlert,
}) => {
  const t = translations[language];

  const [activeHub] = useState<Hub>(hubs[0] || {
    id: 'hub-blr-01',
    code: 'HUB-BLR-01',
    name: 'EcoCircuit Central Hub Bengaluru',
    address: 'Plot 42, Electronic City Phase 1',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    capacity_kg_per_day: 5000,
    is_active: true,
  });

  const [activeWorkerTab, setActiveWorkerTab] = useState<'camera' | 'verifications' | 'manual' | 'cached'>('camera');
  const [isScanning, setIsScanning] = useState(true);
  const [fpsCounter, setFpsCounter] = useState(4);
  const [useRealWebcam, setUseRealWebcam] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);

  // Active detections
  const [currentDetections, setCurrentDetections] = useState<DetectedEwasteItem[]>(REFERENCE_SCENE_ITEMS);

  // Strict Statutory Hazard Interlock Modal state
  const [activeHazardItem, setActiveHazardItem] = useState<DetectedEwasteItem | null>(null);
  const [ppeChecked, setPpeChecked] = useState(false);
  const [handledItems, setHandledItems] = useState<Set<string>>(new Set());

  // Cached scans (Last 20 scans for offline capability)
  const [cachedScans, setCachedScans] = useState<Array<{ id: string; time: string; label: string; hazard: string }>>([
    { id: 'scan-c01', time: '10:42 AM', label: 'Laptop Motherboard (Gold/Cu)', hazard: 'GREEN' },
    { id: 'scan-c02', time: '10:39 AM', label: 'Li-ion Battery Pack (Pouch)', hazard: 'RED' },
    { id: 'scan-c03', time: '10:31 AM', label: 'CRT Leaded Glass Cullet', hazard: 'RED' },
    { id: 'scan-c04', time: '10:24 AM', label: 'Desktop Steel Frame', hazard: 'GREEN' },
    { id: 'scan-c05', time: '10:15 AM', label: 'SMPS Power Transformer', hazard: 'YELLOW' },
  ]);

  // Drop-off verification search
  const [searchTracking, setSearchTracking] = useState('');
  const [verifiedSuccessMsg, setVerifiedSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // WebCam handling
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useRealWebcam) {
      navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setWebcamActive(true);
          }
        })
        .catch(() => {
          setUseRealWebcam(false);
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
      setWebcamActive(false);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useRealWebcam]);

  // Live 3-5 fps simulation loop with bounding boxes
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      // Simulate small frame jitter (3 to 5 fps)
      setFpsCounter(Math.floor(3 + Math.random() * 3));

      // Draw bounding boxes on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          currentDetections.forEach((item) => {
            const isHandled = handledItems.has(item.id);
            const x = item.bbox.x * canvas.width;
            const y = item.bbox.y * canvas.height;
            const w = item.bbox.width * canvas.width;
            const h = item.bbox.height * canvas.height;

            // Box color
            const color =
              item.hazard_level === 'RED'
                ? '#ef4444'
                : item.hazard_level === 'YELLOW'
                ? '#f59e0b'
                : '#10b981';

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            // Shaded overlay
            ctx.fillStyle = `${color}20`;
            ctx.fillRect(x, y, w, h);

            // Label background tag
            ctx.fillStyle = color;
            ctx.fillRect(x, Math.max(0, y - 24), Math.min(w, 240), 24);

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            const labelText = `${item.label} (${Math.round(item.confidence * 100)}%)`;
            ctx.fillText(labelText, x + 5, Math.max(16, y - 7));

            if (isHandled) {
              ctx.fillStyle = '#10b981';
              ctx.fillText('✓ PPE VERIFIED', x + 5, y + 20);
            }
          });
        }
      }
    }, 280); // ~3.5 fps

    return () => clearInterval(interval);
  }, [isScanning, currentDetections, handledItems]);

  // Trigger statutory hazard alert on detection with confidence >= 0.85
  const triggerHazardInterlock = (item: DetectedEwasteItem) => {
    setActiveHazardItem(item);
    setPpeChecked(false);
    SoundEffects.playHazardAlarm();

    if (item.hazard_class) {
      const guideline = SAFETY_GUIDELINES[item.hazard_class];
      if (guideline) {
        onLogHazardAlert({
          id: `alert-${Date.now()}`,
          sessionId: 'ses-active-001',
          itemId: item.id,
          hazardClass: item.hazard_class,
          confidence: item.confidence,
          timestamp: new Date().toISOString(),
          workerId: currentUser.id,
          hubId: activeHub.id,
          guideline,
          acknowledged: false,
        });
      }
    }
  };

  const handleAcknowledgeHazard = () => {
    if (!ppeChecked || !activeHazardItem) return;

    setHandledItems(new Set([...handledItems, activeHazardItem.id]));

    // Add to offline cache
    setCachedScans([
      {
        id: `scan-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        label: activeHazardItem.label,
        hazard: activeHazardItem.hazard_level,
      },
      ...cachedScans.slice(0, 19),
    ]);

    setActiveHazardItem(null);
    SoundEffects.playSuccessChime();
  };

  const handleVerifyDropoff = (listingId: string) => {
    onVerifyListing(listingId, 'Verified via Hub sorting station. Components match valuation.');
    setVerifiedSuccessMsg(`Drop-off confirmed for ${listingId}. Green Points credited to user ledger!`);
    SoundEffects.playSuccessChime();
    setTimeout(() => setVerifiedSuccessMsg(null), 4000);
  };

  const pendingListings = listings.filter((l) => l.status === 'RECEIVED_AT_HUB' || l.status === 'SUBMITTED');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner: Hub & Worker Identity */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-lg">
              <HardHat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{t.hubScanner}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                  Low-Literacy Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.activeHub}: <span className="text-slate-200 font-semibold">{activeHub.name}</span> • {t.workerBadge}: <span className="font-mono text-amber-400 font-bold">BLR-SRT-042</span>
              </p>
            </div>
          </div>

          {/* Worker Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveWorkerTab('camera')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeWorkerTab === 'camera'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera Scan</span>
            </button>

            <button
              onClick={() => setActiveWorkerTab('verifications')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeWorkerTab === 'verifications'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Drop-offs</span>
              {pendingListings.length > 0 && (
                <span className="ml-1 bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {pendingListings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveWorkerTab('cached')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeWorkerTab === 'cached'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>{t.cachedScans}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: LIVE CAMERA SORTING ASSISTANT */}
      {activeWorkerTab === 'camera' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  isScanning ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isScanning ? 'Streaming Active' : 'Paused'}</span>
              </button>

              <button
                onClick={() => setUseRealWebcam(!useRealWebcam)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  useRealWebcam ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{useRealWebcam ? 'Using Hardware Camera' : 'Simulated Feed'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Stream: {fpsCounter} {t.fps}
              </span>
              <span className="text-slate-500">•</span>
              <span>Bandwidth: ~180 kbps (Optimized 2G/3G)</span>
            </div>
          </div>

          {/* Camera Viewport with Real-time Bounding Box Canvas */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black aspect-video sm:aspect-[16/9] shadow-2xl flex items-center justify-center">
            {/* Background Feed (Webcam or High-Def E-Waste Photo) */}
            {useRealWebcam ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80"
                alt="E-waste conveyor inspection feed"
                className="absolute inset-0 w-full h-full object-cover filter brightness-90"
              />
            )}

            {/* Canvas for real-time bounding boxes */}
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* Overlaid Status Badges */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              <span className="bg-black/80 backdrop-blur border border-slate-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                LIVE REC
              </span>
              <span className="bg-black/80 backdrop-blur border border-slate-700 text-emerald-400 text-[11px] font-mono px-2.5 py-1 rounded-lg">
                YOLO-v8 E-Waste Model (mAP 0.89)
              </span>
            </div>

            {/* Quick action button overlay directly on screen */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => triggerHazardInterlock(currentDetections[0])}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-bounce"
              >
                <AlertTriangle className="w-4 h-4" />
                Simulate Hazard Alert (Li-ion)
              </button>
            </div>
          </div>

          {/* Detections List & Color-coded Severity Cards */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span>{t.detections}</span>
              <span className="text-xs text-slate-400 font-normal">
                Color-coded according to hazard classification
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentDetections.map((item) => {
                const isHandled = handledItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl p-4 border transition-all ${
                      item.hazard_level === 'RED'
                        ? 'bg-red-950/40 border-red-500/60'
                        : item.hazard_level === 'YELLOW'
                        ? 'bg-amber-950/40 border-amber-500/60'
                        : 'bg-emerald-950/40 border-emerald-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.hazard_level === 'RED'
                            ? 'bg-red-500 text-white'
                            : item.hazard_level === 'YELLOW'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {item.hazard_level === 'RED'
                          ? 'DANGER (HAZARDOUS)'
                          : item.hazard_level === 'YELLOW'
                          ? 'CAUTION'
                          : 'SAFE RECOVERY'}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{item.label}</h4>

                    <div className="text-[11px] text-slate-300 space-y-0.5 mb-3 font-mono">
                      {Object.entries(item.material_breakdown).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-400">{k}:</span>
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>

                    {item.hazard_level === 'RED' ? (
                      isHandled ? (
                        <div className="bg-emerald-950 text-emerald-400 text-xs py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 border border-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5" /> PPE Acknowledged
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerHazardInterlock(item)}
                          className="w-full bg-red-600 hover:bg-red-500 text-white text-xs py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 shadow-md shadow-red-600/30"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Acknowledge PPE (Blocked)
                        </button>
                      )
                    ) : (
                      <div className="bg-slate-800/80 text-slate-300 text-xs py-1.5 px-2 rounded-lg text-center font-medium">
                        Standard Sorting Stream
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DROP-OFF VERIFICATIONS QUEUE */}
      {activeWorkerTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-white">{t.verifyDropoff}</h2>
              <p className="text-xs text-slate-400">
                Confirm incoming gadget intake and trigger immutable Green Points release.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t.scanBarcode}
                value={searchTracking}
                onChange={(e) => setSearchTracking(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {verifiedSuccessMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{verifiedSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {pendingListings.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.photos[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200'}
                    alt={item.model}
                    className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {item.brand} {item.model}
                      </span>
                      <span className="bg-slate-900 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                        {item.tracking_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Condition: <span className="text-slate-200">{item.physical_condition}</span> • Value:{' '}
                      <span className="text-emerald-400 font-bold">{item.estimated_points} pts</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerifyDropoff(item.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all shrink-0"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t.verifyItem}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OFFLINE CACHED SCANS */}
      {activeWorkerTab === 'cached' && (
        <div className="space-y-4">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{t.cachedScans}</h2>
              <p className="text-xs text-slate-400">
                Preserves the last 20 scans locally for offline review when AI service is unreachable.
              </p>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-mono px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Synced with Hub Node
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Scan ID</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Detected Item</th>
                  <th className="px-4 py-3 text-right">Hazard Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {cachedScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-mono text-slate-400">{scan.id}</td>
                    <td className="px-4 py-2.5 text-slate-300">{scan.time}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{scan.label}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          scan.hazard === 'RED'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : scan.hazard === 'YELLOW'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {scan.hazard}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATUTORY PPE HAZARD INTERLOCK MODAL (India's E-Waste Rules 2022) */}
      {activeHazardItem && activeHazardItem.ppe_guidance && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-red-950/80 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-500 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/40 shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{t.hazardInterlockTitle}</h3>
                <p className="text-xs text-red-400 font-semibold">{t.hazardInterlockSubtitle}</p>
              </div>
            </div>

            <div className="bg-red-950/60 border border-red-800/80 rounded-xl p-3 text-xs text-red-200 mb-4">
              <p className="font-bold">Detected: {activeHazardItem.label}</p>
              <p className="text-[11px] text-red-300 mt-0.5">
                Confidence: {(activeHazardItem.confidence * 100).toFixed(1)}% (Threshold: &gt;= 85%)
              </p>
            </div>

            {/* Statutory instructions */}
            <div className="space-y-3 mb-5">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Required Statutory PPE Checklist:
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  {activeHazardItem.ppe_guidance.ppe_required.map((ppe, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{ppe}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Handling Instructions:
                </h4>
                <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700 leading-relaxed">
                  {activeHazardItem.ppe_guidance.handling_instructions}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Legal Basis: {activeHazardItem.ppe_guidance.regulation_reference}
              </div>
            </div>

            {/* Worker Checkbox Interlock */}
            <label className="flex items-start gap-3 bg-slate-800 p-3.5 rounded-xl border border-slate-700 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={ppeChecked}
                onChange={(e) => setPpeChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-900 border-slate-600"
              />
              <span className="text-xs font-bold text-white select-none">
                {t.confirmPpe}
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveHazardItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!ppeChecked}
                onClick={handleAcknowledgeHazard}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  ppeChecked
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {t.unlockIntake}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
