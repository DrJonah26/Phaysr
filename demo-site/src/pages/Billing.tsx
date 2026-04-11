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

export function Billing() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const handleSelectPlan = () => {
    if (!selectedPlan) return;
    setShowCardForm(true);
  };

  const handleConfirm = () => {
    setShowUpgrade(false);
    setShowCardForm(false);
    setSelectedPlan(null);
    setCardNumber(''); setCardExpiry(''); setCardCvc('');
  };

  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 mt-1">Manage your subscription and invoices</p>
      </header>

      {/* Current plan */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Current plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">Free</span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">$0/mo</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">3 of 3 projects used</div>
          </div>
          <button
            data-testid="billing-upgrade-btn"
            onClick={() => { setShowUpgrade(true); setShowCardForm(false); setSelectedPlan(null); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
          >
            Upgrade plan
          </button>
        </div>
      </section>

      {/* Upgrade flow */}
      {showUpgrade && !showCardForm && (
        <section className="bg-white rounded-xl border border-indigo-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-1">Choose a plan</h2>
          <p className="text-sm text-slate-500 mb-5">All plans include a 14-day free trial.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                data-testid={`plan-option-${plan.id}`}
                onClick={() => setSelectedPlan(plan.id)}
                className={`text-left p-4 rounded-xl border-2 transition-colors ${
                  selectedPlan === plan.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
                <div className="font-semibold text-slate-900 mb-2">{plan.name}</div>
                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-slate-600 flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              data-testid="billing-select-plan-btn"
              onClick={handleSelectPlan}
              disabled={!selectedPlan}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue with {selectedPlan ? PLANS.find(p => p.id === selectedPlan)?.name : '…'}
            </button>
            <button
              data-testid="billing-cancel-upgrade-btn"
              onClick={() => setShowUpgrade(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Card entry */}
      {showUpgrade && showCardForm && (
        <section className="bg-white rounded-xl border border-indigo-200 p-6 mb-6 shadow-sm">
          <h2 className="font-semibold text-slate-900 mb-1">Payment details</h2>
          <p className="text-sm text-slate-500 mb-5">You won't be charged until your trial ends.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Card number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                data-testid="card-number-input"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiry</label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  data-testid="card-expiry-input"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CVC</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  data-testid="card-cvc-input"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                data-testid="billing-confirm-btn"
                onClick={handleConfirm}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
              >
                Start free trial
              </button>
              <button
                data-testid="billing-back-btn"
                onClick={() => setShowCardForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Payment method */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Payment method</h2>
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">No payment method on file</div>
          <button
            data-testid="add-payment-btn"
            className="px-3 py-1.5 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            Add card
          </button>
        </div>
      </section>

      {/* Invoices */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Invoice history</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Invoice</th>
              <th className="text-left px-6 py-3 font-medium">Date</th>
              <th className="text-left px-6 py-3 font-medium">Amount</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {INVOICES.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-slate-900">{inv.id}</td>
                <td className="px-6 py-3 text-slate-600">{inv.date}</td>
                <td className="px-6 py-3 text-slate-900">{inv.amount}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">{inv.status}</span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
