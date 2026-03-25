cat > /Users/nico/trading-game/src/Legal.jsx << 'EOF'
import { useState } from 'react';

export default function Legal({ onBack }) {
  const [view, setView] = useState('quick');

  return (
    <div id="gtm-root" style={{ position: 'relative' }}>
      <div className="scanlines" />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2530', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: '#3a4455', fontFamily: "'Space Mono', monospace", fontSize: '11px', cursor: 'pointer', letterSpacing: '0.06em' }}
            onMouseEnter={e => e.target.style.color = '#e2e8f0'}
            onMouseLeave={e => e.target.style.color = '#3a4455'}
          >← back</button>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '14px', color: '#f0f0f0', letterSpacing: '0.06em' }}>LEGAL</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '16px 20px 0' }}>
          <button onClick={() => setView('quick')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${view === 'quick' ? '#22d3a5' : '#2a3345'}`, background: view === 'quick' ? 'rgba(34,211,165,0.08)' : 'transparent', color: view === 'quick' ? '#22d3a5' : '#4a5568', fontFamily: "'Space Mono', monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}>
            Quick
          </button>
          <button onClick={() => setView('full')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${view === 'full' ? '#22d3a5' : '#2a3345'}`, background: view === 'full' ? 'rgba(34,211,165,0.08)' : 'transparent', color: view === 'full' ? '#22d3a5' : '#4a5568', fontFamily: "'Space Mono', monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}>
            Full Legal
          </button>
        </div>
        <div style={{ padding: '16px 20px 40px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
          {view === 'quick' ? <QuickVersion /> : <FullVersion />}
        </div>
      </div>
    </div>
  );
}

function Section({ emoji, title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '13px', color: '#e2e8f0', marginBottom: '6px' }}>{emoji} {title}</div>
      <div style={{ fontSize: '11px', color: '#6b7a8d', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function QuickVersion() {
  return (
    <div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '10px', color: '#3a4455', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Quick Heads-Up</div>
      <Section emoji="🧠" title="Quick Heads-Up">Tradara is a simulation game, not real trading. Nothing here is financial advice.</Section>
      <Section emoji="📊" title="About the Game">You're trading in a simulated market — no real money, no real risk. Just your skills.</Section>
      <Section emoji="⚠️" title="Keep in Mind">Market data may be delayed or simulated, so don't use it for real-world decisions.</Section>
      <Section emoji="🔐" title="Your Data">We only collect what's needed to run and improve the app. You stay in control of your data.</Section>
      <Section emoji="📜" title="Fair Play">No cheating, exploiting bugs, or disrupting others. Play fair or risk losing access.</Section>
      <Section emoji="💰" title="Purchases">Any purchases are optional and don't guarantee better results — skill still wins.</Section>
      <Section emoji="🚫" title="Responsibility">Your real-world financial decisions are 100% yours. Tradara isn't responsible for them.</Section>
      <Section emoji="🔄" title="Updates">We may update the rules from time to time — we'll keep things transparent.</Section>
    </div>
  );
}

function FullVersion() {
  return (
    <div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '10px', color: '#3a4455', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Terms & Privacy Policy</div>
      <Section emoji="📌" title="Disclaimer">Tradara is provided for educational and entertainment purposes only. The information, simulations, and results presented within the application do not constitute financial, investment, legal, or other professional advice. Users are solely responsible for their real-world financial decisions. Tradara makes no guarantees regarding the accuracy, completeness, or usefulness of the information provided and assumes no liability for any losses incurred as a result of using the application.</Section>
      <Section emoji="⚖️" title="Nature of the Service">Tradara is a market simulation platform designed to recreate trading scenarios in an interactive environment. No real financial transactions are executed, and no user funds are managed. All outcomes within the application occur in a simulated environment and have no impact on real-world assets.</Section>
      <Section emoji="🔐" title="Privacy">Tradara collects only the data necessary to operate and improve the application, including account information, usage data, and performance metrics. This data is used to enhance user experience, maintain security, and optimize the service. We do not sell personal data to third parties. Users have the right to access, modify, or delete their personal data at any time.</Section>
      <Section emoji="📜" title="Terms of Use">By using Tradara, users agree to use the application responsibly and in accordance with these terms. Misuse of the platform, including attempts to exploit bugs, manipulate systems, or disrupt other users, is strictly prohibited. Tradara reserves the right to suspend or terminate accounts that violate these terms without prior notice.</Section>
      <Section emoji="📈" title="Market Data">Market data displayed in Tradara may come from third-party sources and may be delayed, simulated, or not reflective of real-time market conditions. Tradara does not guarantee the accuracy or timeliness of such data and is not responsible for decisions made based on it.</Section>
      <Section emoji="💰" title="Monetization">Tradara may offer premium features, subscriptions, or in-app purchases. All purchases are optional and do not guarantee improved performance or specific results within the application.</Section>
      <Section emoji="⚠️" title="Limitation of Liability">To the fullest extent permitted by law, Tradara shall not be liable for any direct or indirect damages, financial losses, data loss, or other harm arising from the use or inability to use the application.</Section>
      <Section emoji="🧠" title="Intellectual Property">All elements of Tradara, including its design, logo, content, graphics, and software, are owned by its creators or properly licensed. Unauthorized use, reproduction, or distribution is strictly prohibited.</Section>
      <Section emoji="🌍" title="Changes to Terms">Tradara reserves the right to modify these terms at any time. Users are encouraged to review them periodically to stay informed of any updates.</Section>
    </div>
  );
}
EOF