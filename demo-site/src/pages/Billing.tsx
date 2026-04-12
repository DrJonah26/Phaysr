import { useState } from 'react';

const INVOICES = [
  { id: 'INV-2026-04', date: 'Apr 1, 2026', amount: '$0.00', status: 'Paid' },
  { id: 'INV-2026-03', date: 'Mar 1, 2026', amount: '$0.00', status: 'Paid' },
  { id: 'INV-2026-02', date: 'Feb 1, 2026', amount: '$0.00', status: 'Paid' },
];

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    period: '/mo',
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', '50 GB storage'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49',
    period: '/mo',
    features: ['Everything in Pro', 'SSO / SAML', 'Dedicated CSM', 'Custom contracts', 'Unlimited storage'],
  },
];

const CheckIcon = ({ color }: { color: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7"/>
  </svg>
);

export function Billing() {
  const [showUpgrade,  setShowUpgrade]  = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber,   setCardNumber]   = useState('');
  const [cardExpiry,   setCardExpiry]   = useState('');
  const [cardCvc,      setCardCvc]      = useState('');

  const handleSelectPlan = () => { if (selectedPlan) setShowCardForm(true); };

  const handleConfirm = () => {
    setShowUpgrade(false); setShowCardForm(false); setSelectedPlan(null);
    setCardNumber(''); setCardExpiry(''); setCardCvc('');
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 760 }}>

      {/* ── Header ── */}
      <header style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 5px' }}>
          Billing
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Manage your subscription and invoices</p>
      </header>

      {/* ── Current plan ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 14px' }}>
          Current plan
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 26, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
                Free
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, padding: '2px 7px',
                background: 'var(--elevated)', color: 'var(--text-3)',
                borderRadius: 4, border: '1px solid var(--border)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>$0/mo</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>3 of 3 projects used</div>
          </div>
          <button
            data-testid="billing-upgrade-btn"
            className="btn-primary"
            onClick={() => { setShowUpgrade(true); setShowCardForm(false); setSelectedPlan(null); }}
          >
            Upgrade plan
          </button>
        </div>
      </section>

      {/* ── Choose plan ── */}
      {showUpgrade && !showCardForm && (
        <section className="card" style={{ padding: 24, marginBottom: 10, borderColor: 'rgba(156,89,89,0.30)', boxShadow: '0 0 40px rgba(156,89,89,0.06)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 3px' }}>
            Choose a plan
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 18px' }}>All plans include a 14-day free trial.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            {PLANS.map((plan) => {
              const sel = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  data-testid={`plan-option-${plan.id}`}
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    textAlign: 'left', padding: 18, borderRadius: 8,
                    border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    background: sel ? 'rgba(156,89,89,0.06)' : 'var(--elevated)',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s, background 0.12s',
                    boxShadow: sel ? '0 0 24px rgba(156,89,89,0.10)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: sel ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '-0.03em' }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{plan.period}</span>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: sel ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '-0.01em', marginBottom: 10 }}>
                    {plan.name}
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text-2)' }}>
                        <CheckIcon color={sel ? 'var(--accent)' : 'var(--text-3)'} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button data-testid="billing-select-plan-btn" className="btn-primary" onClick={handleSelectPlan} disabled={!selectedPlan}>
              Continue with {selectedPlan ? PLANS.find((p) => p.id === selectedPlan)?.name : '…'}
            </button>
            <button data-testid="billing-cancel-upgrade-btn" className="btn-ghost" onClick={() => setShowUpgrade(false)}>Cancel</button>
          </div>
        </section>
      )}

      {/* ── Card entry ── */}
      {showUpgrade && showCardForm && (
        <section className="card" style={{ padding: 24, marginBottom: 10, borderColor: 'rgba(156,89,89,0.30)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 3px' }}>
            Payment details
          </h2>
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 18px' }}>You won't be charged until your trial ends.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">Card number</label>
              <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} data-testid="card-number-input" className="field-input" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="field-label">Expiry</label>
                <input type="text" placeholder="MM / YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} data-testid="card-expiry-input" className="field-input" />
              </div>
              <div>
                <label className="field-label">CVC</label>
                <input type="text" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} data-testid="card-cvc-input" className="field-input" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button data-testid="billing-confirm-btn" className="btn-primary" onClick={handleConfirm}>Start free trial</button>
              <button data-testid="billing-back-btn" className="btn-ghost" onClick={() => setShowCardForm(false)}>Back</button>
            </div>
          </div>
        </section>
      )}

      {/* ── Payment method ── */}
      <section className="card" style={{ padding: 24, marginBottom: 10 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: '0 0 14px' }}>
          Payment method
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No payment method on file</span>
          <button data-testid="add-payment-btn" className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>Add card</button>
        </div>
      </section>

      {/* ── Invoices ── */}
      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', margin: 0 }}>
            Invoice history
          </h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Invoice', 'Date', 'Amount', 'Status', ''].map((h, i) => (
                <th key={i} style={{
                  padding: '9px 24px', textAlign: i === 4 ? 'right' : 'left',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, fontWeight: 500, color: 'var(--text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv, idx) => (
              <tr
                key={inv.id}
                style={{ borderBottom: idx < INVOICES.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 24px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>
                  {inv.id}
                </td>
                <td style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-2)' }}>{inv.date}</td>
                <td style={{ padding: '12px 24px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-1)' }}>{inv.amount}</td>
                <td style={{ padding: '12px 24px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '2px 8px', borderRadius: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: 'rgba(45, 122, 82, 0.10)',
                    color: 'var(--green)',
                    border: '1px solid rgba(45, 122, 82, 0.22)',
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--green)' }} />
                    {inv.status}
                  </span>
                </td>
                <td style={{ padding: '12px 24px', textAlign: 'right' }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: "'Figtree', system-ui", color: 'var(--accent)', fontWeight: 500, padding: 0 }}>
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

    </div>
  );
}
