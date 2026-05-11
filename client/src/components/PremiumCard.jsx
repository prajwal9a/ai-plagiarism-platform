import {
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export default function PremiumCard({
  onCheckout,
  loading,
}) {
  return (
    <div className="card glass">
      <div className="badge">
        <Crown size={15} />
        Premium Plan
      </div>

      <h2
        style={{
          fontSize: 36,
          margin: "12px 0",
        }}
      >
        Research Pro
      </h2>

      <div className="grid">
        <div className="stat-box">
          <Zap size={16} />
          Faster AI analysis
        </div>

        <div className="stat-box">
          <Sparkles size={16} />
          Unlimited rewrites
        </div>

        <div className="stat-box">
          <ShieldCheck size={16} />
          Unlimited reports
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={onCheckout}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        Upgrade with Stripe
      </button>
    </div>
  );
}