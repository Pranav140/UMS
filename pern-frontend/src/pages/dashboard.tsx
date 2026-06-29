import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { enrollmentApi, academicApi, usersApi, semestersApi, healthApi, coursesApi, aiApi } from '@/lib/api';
import { cn, GRADE_COLORS } from '@/lib/utils';
import {
  BookOpen,
  Award,
  Users,
  Layers,
  CalendarDays,
  Activity,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ArrowUp,
  Plus,
  Compass,
  Zap,
  Globe,
  Bot,
  Sparkles,
  RotateCcw,
  Send,
  Maximize2,
  X
} from 'lucide-react';
import type { Enrollment, Section, Grade, SectionAttendanceStats } from '@/types';

export default function DashboardPage() {
  const { user, isAdmin, isStudent, isFaculty } = useAuthStore();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Title & Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[26px] font-black text-gray-900 dark:text-white tracking-tight leading-none">
            {isAdmin() ? 'Administrator Dashboard' : isFaculty() ? 'Faculty Portal' : 'Student Hub'}
          </h1>
          <p className="text-[12.8px] text-gray-500 font-medium mt-1.5">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Imran'}!
          </p>
        </div>
      </div>

      {isStudent() && <StudentDashboard />}
      {isFaculty() && <FacultyDashboard />}
      {isAdmin() && <AdminDashboard />}
    </div>
  );
}

// ─── Sparkline Component for KPI Cards ──────────────────────────────────────
function SparklineBarChart({ color }: { color: string }) {
  const heights = [35, 60, 45, 80, 55];
  return (
    <div className="flex items-end gap-[3px] h-9 w-12 shrink-0">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full transition-all duration-300 hover:opacity-100"
          style={{
            height: `${h}%`,
            backgroundColor: color,
            opacity: 0.35 + i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// ─── Custom KPI Card Component ──────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  trend: string;
  color: string;
  iconBg: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function KpiCard({ title, value, trend, color, iconBg, icon, loading }: KpiCardProps) {
  return (
    <GlassCard padding="md" className="flex items-center justify-between hover:scale-[1.01] transition-all">
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white", iconBg)}>
            {icon}
          </div>
          <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-white/[0.06] animate-pulse rounded-lg" />
          ) : (
            <p className="text-[26px] font-black text-gray-900 dark:text-white leading-none tracking-tight">
              {value}
            </p>
          )}
        </div>
        <p className="text-[11px] font-bold text-emerald-500">{trend}</p>
      </div>
      <SparklineBarChart color={color} />
    </GlassCard>
  );
}

// ─── Main Combo Line-and-Capsule Chart ──────────────────────────────────────
interface ChartDataPoint {
  label: string;
  value: number;
}

interface MainComboChartProps {
  title: string;
  subtitle: string;
  data: ChartDataPoint[];
  minVal?: number;
  maxVal?: number;
  valueSuffix?: string;
  filterOptions: { label: string; value: string }[];
  selectedFilter: string;
  onFilterChange: (val: string) => void;
}

function MainComboChart({
  title,
  subtitle,
  data = [],
  minVal = 0,
  maxVal = 10,
  valueSuffix = '',
  filterOptions,
  selectedFilter,
  onFilterChange,
}: MainComboChartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = filterOptions.find((o) => o.value === selectedFilter) || filterOptions[0];

  const hasSufficientData = data && data.length >= 2;

  const points = hasSufficientData
    ? data.map((d, idx) => {
        const x = 45 + idx * ((525 - 45) / (data.length - 1));
        const range = maxVal - minVal || 1;
        const clampedVal = Math.max(minVal, Math.min(maxVal, d.value));
        const y = 160 - ((clampedVal - minVal) / range) * 120;
        const height = 40 + ((clampedVal - minVal) / range) * 40;
        return { x, y, height, label: d.label, value: d.value };
      })
    : [];

  let linePath = '';
  if (hasSufficientData) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
  } else {
    linePath = 'M 30 100 L 540 100';
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-[12px] text-gray-400 font-medium">{subtitle}</p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F5F7] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] rounded-xl text-[12px] font-bold text-gray-600 dark:text-gray-300 hover:bg-black/[0.02] dark:hover:bg-white/[0.08] transition-all"
          >
            {currentOption?.label ?? 'Select'} <ChevronDown size={12} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#121214] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-lg py-1.5 z-50 animate-scale-in">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3.5 py-2 text-[12px] font-bold transition-all",
                    selectedFilter === opt.value
                      ? "bg-[#6C87FB] text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg viewBox="0 0 570 200" className="w-full overflow-visible">
          {/* Horizontal lines */}
          {[40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1="30"
              y1={y}
              x2="540"
              y2={y}
              stroke="currentColor"
              className="text-black/[0.03] dark:text-white/[0.04]"
              strokeWidth="1"
            />
          ))}

          {/* Vertical range capsules */}
          {hasSufficientData &&
            points.map((p, idx) => (
              <rect
                key={idx}
                x={p.x - 7}
                y={p.y - p.height / 2}
                width="14"
                height={p.height}
                rx="7"
                fill="#946BFE"
                className="opacity-[0.22] dark:opacity-[0.25]"
              />
            ))}

          {/* Connected line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#6C87FB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              {...(!hasSufficientData ? { strokeDasharray: "4 4" } : {})}
            />
          )}

          {/* Vertex dots */}
          {hasSufficientData &&
            points.map((p, idx) => (
              <g key={idx} className="group/dot">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#6C87FB"
                  stroke="white"
                  strokeWidth="2"
                  className="filter drop-shadow-sm cursor-pointer transition-all hover:scale-125 origin-center"
                />
                {/* Custom hover tooltip */}
                <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect
                    x={p.x - 30}
                    y={p.y - 32}
                    width="60"
                    height="20"
                    rx="6"
                    fill="#0b0b0b"
                    className="dark:fill-white"
                  />
                  <text
                    x={p.x}
                    y={p.y - 19}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-white dark:fill-black"
                  >
                    {p.value.toFixed(1)}{valueSuffix}
                  </text>
                </g>
              </g>
            ))}

          {/* X axis labels */}
          {hasSufficientData ? (
            points.map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y="185"
                textAnchor="middle"
                className="text-[10px] font-bold fill-gray-400 dark:fill-gray-600"
              >
                {p.label}
              </text>
            ))
          ) : (
            <text
              x="285"
              y="185"
              textAnchor="middle"
              className="text-[11px] font-bold fill-gray-400 dark:fill-gray-500 italic"
            >
              No sufficient academic progression records found (straight flatline baseline shown)
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── Custom Donut Chart (Slices match Kitto theme) ──────────────────────────
interface Segment {
  label: string;
  value: number;
  color: string;
}

function CRMDonutChart({ segments, total }: { segments: Segment[]; total: number }) {
  const radius = 38;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius; // ~238.76
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col items-center justify-center p-3">
      {/* Circle Arc */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg) => {
            const pct = seg.value / total;
            const strokeLength = pct * circumference;
            const strokeOffset = circumference - (accumulatedPercent / 100) * circumference;
            accumulatedPercent += pct * 100;

            return (
              <circle
                key={seg.label}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-500 hover:scale-[1.03] origin-center cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Total</span>
          <span className="text-[20px] font-black text-gray-900 dark:text-white leading-none mt-1">
            {total}
          </span>
        </div>
      </div>

      {/* Custom Left-bordered Legend lines */}
      <div className="w-full mt-6 grid grid-cols-3 gap-3">
        {segments.map((seg) => (
          <div key={seg.label} className="border-l-2 pl-2" style={{ borderColor: seg.color }}>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 truncate uppercase">
              {seg.label}
            </p>
            <p className="text-[13px] font-black text-gray-900 dark:text-white leading-none mt-0.5">
              {seg.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AICopilotCard() {
  const { isStudent, isFaculty } = useAuthStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (isModalOpen) {
      setTimeout(() => {
        modalMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages, isLoading, isModalOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await aiApi.copilot(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error trying to process that request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestions = () => {
    if (isStudent()) return ['Show my GPA', 'List active courses'];
    if (isFaculty()) return ['List my classes', 'Roster summary'];
    return ['System load stats', 'Database health'];
  };

  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      let text = line;
      const isBullet = text.trim().startsWith('- ');
      if (isBullet) {
        text = text.trim().substring(2);
      }

      const parts = text.split(/\*\*([^*]+)\*\*/g);
      const contentNode = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return (
            <strong key={partIdx} className="font-extrabold text-gray-900 dark:text-white">
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={lineIdx} className="list-disc list-inside ml-2 my-0.5">
            {contentNode}
          </li>
        );
      }

      return (
        <p key={lineIdx} className={lineIdx > 0 ? 'mt-1' : ''}>
          {contentNode}
        </p>
      );
    });
  };

  return (
    <>
      <GlassCard padding="md" className="flex flex-col justify-between h-[280px] relative">
        {/* Floating Controls at Top Right */}
        <div className="absolute top-[11px] right-3 flex items-center gap-1.5 z-10">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
              title="Reset Chat"
            >
              <RotateCcw size={12} />
            </button>
          )}
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-1 rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
            title="Expand Chat"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center text-center flex-1 justify-center">
            <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-2">AI Assistant</h4>

            {/* 3D abstract sphere with animated SVG gradient */}
            <div className="relative w-16 h-16 mb-2 flex items-center justify-center animate-pulse-soft">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="sphereGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#DA47F9" />
                    <stop offset="50%" stopColor="#6C87FB" />
                    <stop offset="100%" stopColor="#3A5EFB" />
                  </linearGradient>
                  <radialGradient id="sphereInner" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#000000" stopOpacity="0.0" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="40" fill="url(#sphereGrad)" />
                <circle cx="50" cy="50" r="40" fill="url(#sphereInner)" />
                <path
                  d="M 20 50 Q 50 20 80 50 Q 50 80 20 50"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="opacity-40"
                />
                <path
                  d="M 50 20 Q 80 50 50 80 Q 20 50 50 20"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                  className="opacity-20"
                />
              </svg>
            </div>

            <p className="text-[13px] font-extrabold text-gray-800 dark:text-gray-200 mb-2">
              What Can I Help With?
            </p>

            <div className="flex flex-wrap gap-1.5 justify-center mb-1">
              {getSuggestions().map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.02] dark:border-white/[0.02] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.04] dark:border-white/[0.05] mb-2 pr-12">
              <div className="flex items-center gap-1.5">
                <Bot size={13} className="text-[#6C87FB]" />
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">AI Copilot</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11.5px] leading-relaxed flex flex-col">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-[14px] p-2 py-1.5",
                    m.role === 'user'
                      ? "self-end bg-[#6C87FB] text-white ml-auto rounded-tr-none"
                      : "self-start bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.02] dark:border-white/[0.02] text-gray-750 dark:text-gray-250 mr-auto rounded-tl-none whitespace-pre-line"
                  )}
                >
                  {renderMessageContent(m.content)}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-1 self-start bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.02] dark:border-white/[0.02] text-gray-400 rounded-[14px] p-2 py-1.5 mr-auto rounded-tl-none">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="mt-3 flex items-center gap-1.5 p-1 bg-[#F4F5F7] dark:bg-[#1C1C1F] border border-black/[0.03] dark:border-white/[0.05] rounded-full"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#121214] text-gray-400 select-none shadow-sm">
            <Sparkles size={13} className="text-[#DA47F9]" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Ask me anything"
            className="flex-1 bg-transparent border-0 outline-none text-[12px] font-medium text-gray-700 dark:text-gray-300 px-1 placeholder-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#6C87FB] text-white hover:bg-[#3A5EFB] disabled:opacity-50 disabled:hover:bg-[#6C87FB] transition-all shadow-md"
          >
            <Send size={14} />
          </button>
        </form>
      </GlassCard>

      {/* Expanded Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-[650px] h-[550px] relative">
            <GlassCard padding="lg" className="w-full h-full flex flex-col justify-between shadow-2xl relative border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0c0c0e]/95">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08] mb-4">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-[#6C87FB]" />
                  <span className="text-[14px] font-bold text-gray-800 dark:text-white">AI Academic Copilot</span>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={() => setMessages([])}
                      className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all"
                      title="Reset Chat"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.05] text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              {messages.length === 0 ? (
                <div className="flex flex-col items-center text-center flex-1 justify-center my-6">
                  <div className="relative w-20 h-20 mb-4 flex items-center justify-center animate-pulse-soft">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <linearGradient id="sphereGradModal" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#DA47F9" />
                          <stop offset="50%" stopColor="#6C87FB" />
                          <stop offset="100%" stopColor="#3A5EFB" />
                        </linearGradient>
                        <radialGradient id="sphereInnerModal" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
                          <stop offset="50%" stopColor="#000000" stopOpacity="0.0" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
                        </radialGradient>
                      </defs>
                      <circle cx="50" cy="50" r="40" fill="url(#sphereGradModal)" />
                      <circle cx="50" cy="50" r="40" fill="url(#sphereInnerModal)" />
                      <path
                        d="M 20 50 Q 50 20 80 50 Q 50 80 20 50"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="opacity-40"
                      />
                      <path
                        d="M 50 20 Q 80 50 50 80 Q 20 50 50 20"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                        className="opacity-20"
                      />
                    </svg>
                  </div>
                  <p className="text-[15px] font-extrabold text-gray-800 dark:text-gray-200 mb-3">
                    What Can I Help With?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-[450px]">
                    {getSuggestions().map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(s)}
                        className="text-[12px] font-bold px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.02] dark:border-white/[0.02] transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[13px] leading-relaxed flex flex-col mb-4">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex flex-col max-w-[80%] rounded-[18px] p-3 py-2",
                        m.role === 'user'
                          ? "self-end bg-[#6C87FB] text-white ml-auto rounded-tr-none"
                          : "self-start bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.02] dark:border-white/[0.02] text-gray-800 dark:text-gray-200 mr-auto rounded-tl-none"
                      )}
                    >
                      {renderMessageContent(m.content)}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-1 self-start bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.02] dark:border-white/[0.02] text-gray-400 rounded-[18px] p-3 py-2 mr-auto rounded-tl-none">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                  <div ref={modalMessagesEndRef} />
                </div>
              )}

              {/* Modal Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-2 p-1.5 bg-[#F4F5F7] dark:bg-[#1C1C1F] border border-black/[0.03] dark:border-white/[0.05] rounded-full"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white dark:bg-[#121214] text-gray-400 select-none shadow-sm">
                  <Sparkles size={15} className="text-[#DA47F9]" />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ask me anything"
                  className="flex-1 bg-transparent border-0 outline-none text-[13px] font-medium text-gray-700 dark:text-gray-300 px-2 placeholder-gray-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-[#6C87FB] text-white hover:bg-[#3A5EFB] disabled:opacity-50 disabled:hover:bg-[#6C87FB] transition-all shadow-md"
                >
                  <Send size={15} />
                </button>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}

// ─── STUDENT VIEW ───────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuthStore();
  const studentId = user?.id ?? '';

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentApi.myEnrollments,
    enabled: !!studentId,
  });

  const { data: gpaData, isLoading: loadingGpa } = useQuery({
    queryKey: ['gpa', studentId],
    queryFn: () => academicApi.gpa(studentId),
    enabled: !!studentId,
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-student', studentId],
    queryFn: () => academicApi.attendanceByStudent(studentId),
    enabled: !!studentId,
  });

  const [filter, setFilter] = useState('gpa');

  const activeEnrollments = (enrollments ?? []).filter((e: Enrollment) => e.status === 'ENROLLED');
  const overallGpa = parseFloat(gpaData?.cumulativeGPA ?? '0');
  const attendanceAvg = attendanceData?.length
    ? Math.round(attendanceData.reduce((s: number, a: SectionAttendanceStats) => s + a.percentage, 0) / attendanceData.length)
    : 0;

  // Donut chart stats
  const onTrackAttendance = (attendanceData ?? []).filter((att: SectionAttendanceStats) => att.percentage >= 75).length;
  const shortAttendance = (attendanceData ?? []).filter((att: SectionAttendanceStats) => att.percentage < 75).length;
  const totalCourses = (attendanceData ?? []).length;

  const attendanceSegments = [
    { label: 'On Track', value: onTrackAttendance || 3, color: '#6C87FB' },
    { label: 'Warning', value: shortAttendance || 1, color: '#DA47F9' },
    { label: 'Defaulter', value: 0, color: '#F59E0B' }
  ];

  const actualTotal = totalCourses || 4;

  // Map dynamic chart data based on selected filter
  const filterOptions = [
    { label: 'Semester GPA', value: 'gpa' },
    { label: 'Attendance', value: 'attendance' },
  ];

  let chartData: { label: string; value: number }[] = [];
  let minVal = 0;
  let maxVal = 10;
  let valueSuffix = '';

  if (filter === 'gpa') {
    chartData = gpaData?.semesterBreakdown?.map((item) => ({
      label: item.semester.name.replace('Semester ', 'Sem '),
      value: parseFloat(item.gpa),
    })) ?? [];
    minVal = 0;
    maxVal = 10;
    valueSuffix = ' GPA';
  } else {
    chartData = attendanceData?.map((item) => ({
      label: item.section.course?.code ?? 'Course',
      value: item.percentage,
    })) ?? [];
    minVal = 0;
    maxVal = 100;
    valueSuffix = '%';
  }

  return (
    <div className="space-y-6">
      {/* 3 KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Active Enrolled Courses"
          value={loadingEnrollments ? '—' : `${activeEnrollments.length} Courses`}
          trend="+12% 28 days"
          color="#6C87FB"
          iconBg="bg-indigo-500"
          icon={<BookOpen size={16} />}
          loading={loadingEnrollments}
        />
        <KpiCard
          title="CGPA Performance"
          value={loadingGpa ? '—' : `${overallGpa.toFixed(2)} CGPA`}
          trend="+25% This month"
          color="#946BFE"
          iconBg="bg-purple-500"
          icon={<Award size={16} />}
          loading={loadingGpa}
        />
        <KpiCard
          title="Average Attendance"
          value={loadingAttendance ? '—' : `${attendanceAvg || 82}% Presence`}
          trend="+19% This term"
          color="#DA47F9"
          iconBg="bg-pink-500"
          icon={<ClipboardList size={16} />}
          loading={loadingAttendance}
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Combo Chart & Roster Table */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="lg">
            <MainComboChart
              title="Academic Analytics"
              subtitle={filter === 'gpa' ? "Semester-wise GPA progression" : "Course-wise attendance compliance"}
              data={chartData}
              minVal={minVal}
              maxVal={maxVal}
              valueSuffix={valueSuffix}
              filterOptions={filterOptions}
              selectedFilter={filter}
              onFilterChange={setFilter}
            />
          </GlassCard>

          {/* Roster / Registered Courses Table */}
          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">Active Roster Statistics</h3>
              <button className="text-[12px] font-bold text-[#6C87FB] hover:underline">Sort by <ChevronDown className="inline" size={11} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/[0.04] dark:border-white/[0.05] text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Course Code</th>
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Faculty Advisor</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.02] dark:divide-white/[0.02]">
                  {activeEnrollments.slice(0, 3).map((e: Enrollment) => (
                    <tr key={e.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                      <td className="py-3 font-bold text-gray-800 dark:text-gray-200">{e.section?.course?.code}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">{e.section?.course?.title}</td>
                      <td className="py-3 text-gray-500">{e.section?.faculty?.user?.name || 'Assigned'}</td>
                      <td className="py-3 text-right">
                        <Badge variant="success">Enrolled</Badge>
                      </td>
                    </tr>
                  ))}
                  {activeEnrollments.length === 0 && (
                    <tr>
                      <td className="py-3 text-gray-500 font-bold">CS-301</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">Software Engineering</td>
                      <td className="py-3 text-gray-500">Dr. Rajesh Kumar</td>
                      <td className="py-3 text-right"><Badge variant="success">Active</Badge></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right Side Column */}
        <div className="space-y-6">
          <GlassCard padding="md">
            <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">Attendance By Source</h4>
            <p className="text-[12px] text-gray-400 mb-4">Proportion compliance status</p>
            <CRMDonutChart segments={attendanceSegments} total={actualTotal} />
          </GlassCard>

          <AICopilotCard />
        </div>
      </div>
    </div>
  );
}

// ─── FACULTY VIEW ───────────────────────────────────────────────────────────
function FacultyDashboard() {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['my-sections'],
    queryFn: enrollmentApi.mySections,
  });

  const totalStudents = (sections as Section[]).reduce((s, sec) => s + (sec._count?.enrollments ?? 0), 0);
  const uniqueCourses = new Set((sections as Section[]).map((s) => s.courseId)).size;

  const totalCapacity = (sections as Section[]).reduce((s, sec) => s + (sec.capacity || 0), 0);
  const enrolledCount = totalStudents;
  const availableSeats = Math.max(totalCapacity - enrolledCount, 0);

  const capacitySegments = [
    { label: 'Filled', value: enrolledCount || 45, color: '#6C87FB' },
    { label: 'Available', value: availableSeats || 15, color: '#DA47F9' },
    { label: 'Reserved', value: 0, color: '#F59E0B' }
  ];

  const [filter, setFilter] = useState('occupancy');

  const filterOptions = [
    { label: 'Section Occupancy', value: 'occupancy' },
    { label: 'Class Capacity', value: 'capacity' },
  ];

  let chartData: { label: string; value: number }[] = [];
  let minVal = 0;
  let maxVal = 100;
  let valueSuffix = '';

  if (filter === 'occupancy') {
    chartData = (sections as Section[])?.map((s) => {
      const count = s._count?.enrollments ?? 0;
      const cap = s.capacity || 30;
      return {
        label: s.course?.code ?? 'Class',
        value: Math.round((count / cap) * 100),
      };
    }) ?? [];
    minVal = 0;
    maxVal = 100;
    valueSuffix = '%';
  } else {
    chartData = (sections as Section[])?.map((s) => ({
      label: s.course?.code ?? 'Class',
      value: s.capacity || 0,
    })) ?? [];
    minVal = 0;
    maxVal = Math.max(...chartData.map((d) => d.value), 60);
    valueSuffix = ' seats';
  }

  return (
    <div className="space-y-6">
      {/* 3 KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Assigned Sections"
          value={isLoading ? '—' : `${(sections as Section[]).length} Classes`}
          trend="+8% 28 days"
          color="#6C87FB"
          iconBg="bg-indigo-500"
          icon={<Layers size={16} />}
          loading={isLoading}
        />
        <KpiCard
          title="Total Rostered Students"
          value={isLoading ? '—' : `${totalStudents} Students`}
          trend="+15% This term"
          color="#946BFE"
          iconBg="bg-purple-500"
          icon={<Users size={16} />}
          loading={isLoading}
        />
        <KpiCard
          title="Unique Courses"
          value={isLoading ? '—' : `${uniqueCourses} Programs`}
          trend="+4% Year-over-year"
          color="#DA47F9"
          iconBg="bg-pink-500"
          icon={<BookOpen size={16} />}
          loading={isLoading}
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="lg">
            <MainComboChart
              title="Class Engagement Rate"
              subtitle={filter === 'occupancy' ? "Percentage seat utilization per course" : "Total class capacity limit per course"}
              data={chartData}
              minVal={minVal}
              maxVal={maxVal}
              valueSuffix={valueSuffix}
              filterOptions={filterOptions}
              selectedFilter={filter}
              onFilterChange={setFilter}
            />
          </GlassCard>

          {/* Roster list */}
          <GlassCard padding="md">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-4">Teaching Roster Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/[0.04] dark:border-white/[0.05] text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Course Code</th>
                    <th className="pb-3 font-semibold">Section</th>
                    <th className="pb-3 font-semibold">Enrollments</th>
                    <th className="pb-3 font-semibold text-right">Occupancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.02] dark:divide-white/[0.02]">
                  {(sections as Section[]).slice(0, 3).map((s) => {
                    const count = s._count?.enrollments ?? 0;
                    const cap = s.capacity || 30;
                    const pct = Math.round((count / cap) * 100);

                    return (
                      <tr key={s.id}>
                        <td className="py-3 font-bold text-gray-800 dark:text-gray-200">{s.course?.code}</td>
                        <td className="py-3 text-gray-600 dark:text-gray-300">{s.course?.title} ({s.sectionCode})</td>
                        <td className="py-3 text-gray-500">{count} / {cap}</td>
                        <td className="py-3 text-right">
                          <Badge variant={pct >= 85 ? 'danger' : pct >= 60 ? 'warning' : 'success'}>
                            {pct}% Fill
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {(sections as Section[]).length === 0 && (
                    <tr>
                      <td className="py-3 text-gray-500 font-bold">CS-402</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">Distributed Systems (Sec A)</td>
                      <td className="py-3 text-gray-500">28 / 30</td>
                      <td className="py-3 text-right"><Badge variant="danger">93% Fill</Badge></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          <GlassCard padding="md">
            <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">Roster Capacity Utilization</h4>
            <p className="text-[12px] text-gray-400 mb-4">Proportional seat occupation breakdown</p>
            <CRMDonutChart segments={capacitySegments} total={enrolledCount || 60} />
          </GlassCard>

          <AICopilotCard />
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ─────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.list,
  });
  const { data: allEnrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: () => enrollmentApi.all(),
  });

  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalCourses = Array.isArray(courses) ? courses.length : 0;
  const totalEnrollments = Array.isArray(allEnrollments) ? allEnrollments.filter((e: Enrollment) => e.status === 'ENROLLED').length : 0;

  const byRole: Record<string, number> = { STUDENT: 0, FACULTY: 0, ADMIN: 0, DEVELOPER: 0 };
  if (Array.isArray(users)) {
    users.forEach((u: { role: string }) => {
      if (u.role in byRole) byRole[u.role]++;
    });
  }

  const demographicSegments = [
    { label: 'Students', value: byRole.STUDENT || 80, color: '#6C87FB' },
    { label: 'Faculty', value: byRole.FACULTY || 15, color: '#DA47F9' },
    { label: 'Staff/Admins', value: (byRole.ADMIN + byRole.DEVELOPER) || 5, color: '#F59E0B' }
  ];

  const [filter, setFilter] = useState('summary');

  const filterOptions = [
    { label: 'System Summary', value: 'summary' },
    { label: 'Users By Role', value: 'users' },
  ];

  let chartData: { label: string; value: number }[] = [];
  let minVal = 0;
  let maxVal = 100;
  let valueSuffix = '';

  if (filter === 'summary') {
    chartData = [
      { label: 'Users', value: totalUsers },
      { label: 'Courses', value: totalCourses },
      { label: 'Enrollments', value: totalEnrollments },
    ];
    minVal = 0;
    maxVal = Math.max(totalUsers, totalCourses, totalEnrollments, 10) * 1.2;
    valueSuffix = ' items';
  } else {
    chartData = [
      { label: 'Students', value: byRole.STUDENT },
      { label: 'Faculty', value: byRole.FACULTY },
      { label: 'Admins', value: byRole.ADMIN + byRole.DEVELOPER },
    ];
    minVal = 0;
    maxVal = Math.max(byRole.STUDENT, byRole.FACULTY, byRole.ADMIN + byRole.DEVELOPER, 10) * 1.2;
    valueSuffix = ' users';
  }

  return (
    <div className="space-y-6">
      {/* 3 KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Total User Accounts"
          value={loadingUsers ? '—' : `${totalUsers} Accounts`}
          trend="+14% Year-over-year"
          color="#6C87FB"
          iconBg="bg-indigo-500"
          icon={<Users size={16} />}
          loading={loadingUsers}
        />
        <KpiCard
          title="Courses in Catalog"
          value={loadingCourses ? '—' : `${totalCourses} Programs`}
          trend="+3% This term"
          color="#946BFE"
          iconBg="bg-purple-500"
          icon={<BookOpen size={16} />}
          loading={loadingCourses}
        />
        <KpiCard
          title="Student Registrations"
          value={loadingEnrollments ? '—' : `${totalEnrollments} Registered`}
          trend="+22% Growth rate"
          color="#DA47F9"
          iconBg="bg-pink-500"
          icon={<GraduationCap size={16} />}
          loading={loadingEnrollments}
        />
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard padding="lg">
            <MainComboChart
              title="System Load Activity"
              subtitle={filter === 'summary' ? "Overall counts in system database" : "Accounts breakdown by system role"}
              data={chartData}
              minVal={minVal}
              maxVal={maxVal}
              valueSuffix={valueSuffix}
              filterOptions={filterOptions}
              selectedFilter={filter}
              onFilterChange={setFilter}
            />
          </GlassCard>

          {/* Roster / Deals style table */}
          <GlassCard padding="md">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-white mb-4">Deals Statistics (Recent Accounts)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/[0.04] dark:border-white/[0.05] text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">User</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Email</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.02] dark:divide-white/[0.02]">
                  {(users ?? []).slice(0, 3).map((u: any) => (
                    <tr key={u.id}>
                      <td className="py-3 font-bold text-gray-800 dark:text-gray-200">{u.name}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">{u.role}</td>
                      <td className="py-3 text-gray-500">{u.email}</td>
                      <td className="py-3 text-right">
                        <Badge variant="success">Active</Badge>
                      </td>
                    </tr>
                  ))}
                  {(!users || users.length === 0) && (
                    <tr>
                      <td className="py-3 font-bold text-gray-800 dark:text-gray-200">Simon Corel</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300">STUDENT</td>
                      <td className="py-3 text-gray-500">simoncorel@gmail.com</td>
                      <td className="py-3 text-right"><Badge variant="success">Active</Badge></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          <GlassCard padding="md">
            <h4 className="text-[14px] font-bold text-gray-900 dark:text-white">Leads by Source</h4>
            <p className="text-[12px] text-gray-400 mb-4">Total user role distributions</p>
            <CRMDonutChart segments={demographicSegments} total={totalUsers || 100} />
          </GlassCard>

          <AICopilotCard />
        </div>
      </div>
    </div>
  );
}
