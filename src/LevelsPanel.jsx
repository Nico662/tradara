import { X, Check } from 'lucide-react';
import { LEVELS, getXP, getLevel, getNextLevel, getProgress } from './levels.js';
import { LevelIcon } from './components/AppIcons.jsx';

export default function LevelsPanel({ onClose }) {
  const xp       = getXP();
  const level    = getLevel(xp);
  const next     = getNextLevel(xp);
  const progress = getProgress(xp);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 9000,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      <div style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 9001,
        background: 'var(--bg-card)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        border: '1px solid var(--border-default)',
        borderBottom: 'none',
        maxHeight: '85vh',
        overflowY: 'auto',
        animation: 'lpSlideUp 0.32s cubic-bezier(0.34,1.2,0.64,1) both',
      }}>
        <style>{`
          @keyframes lpSlideUp {
            from { transform: translateY(100%); opacity: 0 }
            to   { transform: translateY(0);    opacity: 1 }
          }
        `}</style>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--border-default)' }} />
        </div>

        <div style={{ padding: '16px 20px 40px' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '60px', height: '60px',
                  borderRadius: '16px',
                  background: 'var(--green-dim)',
                  border: '1px solid var(--border-green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <LevelIcon id={level.id} size={28} style={{ stroke: 'var(--green)' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '24px', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {level.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.04em' }}>
                    {xp.toLocaleString()} XP
                    {next ? ` · faltan ${(next.xp - xp).toLocaleString()} XP` : ' · Nivel máximo'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: '6px', background: 'var(--border-default)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--green), #22d3a5)',
                  borderRadius: '3px',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>
                  {progress}%
                </span>
                {next && (
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-hint)' }}>
                    {next.name} · {next.xp.toLocaleString()} XP
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                borderRadius: '50%',
                width: '32px', height: '32px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                marginLeft: '14px',
                marginTop: '2px',
              }}
            >
              <X size={14} strokeWidth={2} style={{ stroke: 'var(--text-muted)' }} />
            </button>
          </div>

          {/* ── Levels list ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {LEVELS.map(l => {
              const unlocked  = xp >= l.xp;
              const isCurrent = l.id === level.id;
              const xpToGo    = l.xp - xp;

              return (
                <div
                  key={l.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: isCurrent ? '1px solid var(--green)' : '1px solid var(--border-default)',
                    background: isCurrent
                      ? 'rgba(0,229,160,0.05)'
                      : unlocked
                        ? 'rgba(255,255,255,0.02)'
                        : 'transparent',
                    opacity: (!unlocked && !isCurrent) ? 0.45 : 1,
                  }}
                >
                  {/* Icon box */}
                  <div style={{
                    width: '38px', height: '38px',
                    borderRadius: '10px',
                    background: isCurrent ? 'var(--green-dim)' : unlocked ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: isCurrent ? '1px solid var(--border-green)' : '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <LevelIcon
                      id={l.id}
                      size={18}
                      style={{ stroke: isCurrent ? 'var(--green)' : unlocked ? 'var(--text-muted)' : 'var(--text-hint)' }}
                    />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: isCurrent ? '4px' : '2px' }}>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 800,
                        fontSize: '13px',
                        color: isCurrent ? 'var(--green)' : unlocked ? 'var(--text-primary)' : 'var(--text-hint)',
                      }}>
                        {l.name}
                      </span>
                      {isCurrent && (
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: 'var(--green)',
                          background: 'var(--green-dim)',
                          border: '1px solid var(--border-green)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          letterSpacing: '0.08em',
                        }}>
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-hint)' }}>
                      {l.xp === 0 ? 'Nivel inicial' : `${l.xp.toLocaleString()} XP`}
                    </div>
                    {/* Mini progress bar for current level */}
                    {isCurrent && next && (
                      <div style={{ marginTop: '6px', height: '3px', background: 'var(--border-default)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${progress}%`,
                          background: 'var(--green)',
                          borderRadius: '2px',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    )}
                  </div>

                  {/* Right badge */}
                  {unlocked && !isCurrent && (
                    <Check size={16} strokeWidth={2.5} style={{ stroke: 'var(--green)', flexShrink: 0 }} />
                  )}
                  {!unlocked && (
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      color: 'var(--text-hint)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}>
                      +{xpToGo.toLocaleString()} XP
                    </span>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
