import React, { useState } from 'react';
import { PostContent } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Video, 
  Layers, 
  Image as ImageIcon 
} from 'lucide-react';

interface CalendarViewProps {
  posts: PostContent[];
  onSelectPost: (post: PostContent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ posts, onSelectPost }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (posts && posts.length > 0) {
      const valid = posts.filter(p => p.scheduledDate && !isNaN(new Date(p.scheduledDate).getTime()));
      if (valid.length > 0) {
        const sorted = [...valid].sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
        const d = new Date(sorted[0].scheduledDate);
        return new Date(d.getFullYear(), d.getMonth(), 1);
      }
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [filterStatus, setFilterStatus] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Months with posts for quick navigation
  const monthsWithPosts = Array.from(
    new Set(
      posts
        .map(p => {
          if (!p.scheduledDate) return null;
          const d = new Date(p.scheduledDate);
          if (isNaN(d.getTime())) return null;
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        })
        .filter((m): m is string => Boolean(m))
    )
  ).sort().reverse();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleJumpToMonth = (yearMonthStr: string) => {
    const [y, m] = yearMonthStr.split('-').map(Number);
    if (y && m) {
      setCurrentDate(new Date(y, m - 1, 1));
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  // Build grid calendar cells
  const calendarCells = [];

  // Previous month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(prevMonthDays - i).padStart(2, '0')}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateString: `${year}-${mStr}-${dStr}`,
    });
  }

  // Next month padding days to complete 35 or 42 cells
  const totalCells = Math.ceil(calendarCells.length / 7) * 7;
  const remaining = totalCells - calendarCells.length;
  for (let n = 1; n <= remaining; n++) {
    const nextM = month + 2 > 12 ? 1 : month + 2;
    const nextY = month + 2 > 12 ? year + 1 : year;
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      dateString: `${nextY}-${String(nextM).padStart(2, '0')}-${String(n).padStart(2, '0')}`,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Calendar Top Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 capitalize">
              {monthNames[month]} <span className="font-mono text-slate-500">{year}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Grade de agendamento mensal de publicações ({filteredPosts.length} posts carregados)
            </p>
          </div>
        </div>

        {/* Controls and filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick month pills if posts exist in other months */}
          {monthsWithPosts.length > 0 && (
            <div className="hidden md:flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 p-1 rounded-lg">
              <span className="text-slate-400 px-1 text-[10px]">Meses:</span>
              {monthsWithPosts.map(m => {
                const [y, mNum] = m.split('-').map(Number);
                const isSelected = y === year && mNum - 1 === month;
                return (
                  <button
                    key={m}
                    onClick={() => handleJumpToMonth(m)}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {monthNames[mNum - 1].slice(0, 3)}/{String(y).slice(2)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg text-xs font-medium text-slate-600">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pending_approval', label: 'Pendentes' },
              { id: 'changes_requested', label: 'Alteração' },
              { id: 'approved', label: 'Aprovados' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500 py-2.5">
        {daysOfWeek.map((day, idx) => (
          <div key={idx} className={idx === 0 || idx === 6 ? 'text-slate-400' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
        {calendarCells.map((cell, idx) => {
          // Robust matching of posts to cell date
          const cellPosts = filteredPosts.filter(p => {
            if (!p.scheduledDate) return false;
            if (p.scheduledDate.startsWith(cell.dateString)) return true;
            const d = new Date(p.scheduledDate);
            if (isNaN(d.getTime())) return false;
            const pY = d.getFullYear();
            const pM = String(d.getMonth() + 1).padStart(2, '0');
            const pD = String(d.getDate()).padStart(2, '0');
            return `${pY}-${pM}-${pD}` === cell.dateString;
          });

          return (
            <div
              key={idx}
              className={`p-1.5 sm:p-2 min-h-[95px] sm:min-h-[110px] flex flex-col transition-colors ${
                cell.isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/40 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-mono font-medium ${
                    cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {cell.day}
                </span>
                {cellPosts.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {cellPosts.length}
                  </span>
                )}
              </div>

              {/* Day Posts List */}
              <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px]">
                {cellPosts.map(post => {
                  let badgeBg = 'bg-brand-light border-brand-light text-brand-dark';
                  let StatusIcon = Clock;

                  if (post.status === 'approved') {
                    badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-900';
                    StatusIcon = CheckCircle2;
                  } else if (post.status === 'changes_requested') {
                    badgeBg = 'bg-amber-50 border-amber-200 text-amber-900';
                    StatusIcon = AlertTriangle;
                  }

                  const timeStr = post.scheduledDate ? post.scheduledDate.slice(11, 16) : '';

                  return (
                    <button
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className={`w-full text-left p-1.5 rounded-lg border text-[11px] leading-tight transition-all hover:scale-[1.02] shadow-2xs ${badgeBg}`}
                      title={post.title}
                    >
                      <div className="flex items-center gap-1 font-semibold truncate">
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">{post.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] opacity-75 font-mono mt-0.5">
                        <span>{timeStr || '10:00'}</span>
                        <span className="uppercase text-[9px]">
                          {post.mediaType === 'drive_video' ? 'Drive' : post.mediaType}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
