import { useState } from "react";

import Navbar from "../components/Navbar";
import PremiumCard from "../components/PremiumCard";

import { stripeAPI } from "../services/api";

export default function Subscription({
  themeContext,
}) {
  const [loading, setLoading] =
    useState(false);

  const checkout = async () => {
    setLoading(true);

    try {
      const res =
        await stripeAPI.checkout();

      const url =
        res.data.url;

      if (url)
        window.location.href = url;
    } catch {
      alert("Stripe failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar
        themeContext={themeContext}
      />

      <main className="page">
        <PremiumCard
          onCheckout={checkout}
          loading={loading}
        />
      </main>
    </div>
  );
}