import React, { useState, useEffect } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

export default function InAppPayment() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_URL;

  const token = localStorage.getItem("token");
  console.log(location.state);
  const { eventId, category, isFree } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [flatFee, setFlatFee] = useState(0);

  // Handle countdown + redirect
    useEffect(() =>{
        getFlatFee();
    },[])

  useEffect(() => {
    if (success) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(interval);
            navigate("/");
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [success, navigate]);

  const getFlatFee = async () => {
    const response = await axios.get(`${baseUrl}admin/category-fees`);
    setFlatFee(response.data.find(item => item.category === category)?.fee || 0);
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await axios.post(
        `${import.meta.env.VITE_API_URL}stripe/purchase-intent/${eventId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (resp.status !== 201) throw new Error("Unable to create PaymentIntent");
      const { clientSecret, amount, breakdown, description } = resp.data;
      setSummary({ amount, breakdown, description });

      const paymentMethod = {
        card: elements.getElement(CardNumberElement),
        billing_details: { name, email },
      };

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod,
      });

      if (result.error) throw new Error(result.error.message);

      if (result.paymentIntent.status === "succeeded") {
        setSuccess(true);
      } else {
        throw new Error("Payment not completed");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const elementStyle = {
    style: {
      base: {
        fontSize: "16px",
        color: "#2d3748",
        fontFamily: "system-ui, sans-serif",
        "::placeholder": { color: "#a0aec0" },
      },
      invalid: { color: "#fa755a" },
    },
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col relative">
      {/* Header */}
      <div className="w-full flex justify-center items-center gap-3">
          <img src={'/brandLogoFinal.png'} alt="Brand Logo" className="3-40 h-20 w-auto" />
      </div>

      {/* Main Form */}
      <main className="flex-1 w-full max-w-3xl mx-auto py-10 px-6">
        <form onSubmit={handlePayment} className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Payment Details
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Please enter your information below to complete your payment.
          </p>

          {/* Billing Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-3 border-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-3 border-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800"
            />
          </div>

          {/* Card Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <div className="p-3 border-1 border-gray-300 rounded-lg transition">
              <CardNumberElement options={elementStyle} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date
              </label>
              <div className="p-3 border-1 border-gray-300 rounded-lg transition">
                <CardExpiryElement options={elementStyle} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <div className="p-3 border-1 border-gray-300 rounded-lg transition">
                <CardCvcElement options={elementStyle} />
              </div>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Order Summary
              </h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Event Price</span>
                <span>${summary.breakdown.eventPrice}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Flat Fee</span>
                <span>${summary.breakdown.flatFee}</span>
              </div>
              <div className="flex justify-between text-base font-semibold mt-3 text-gray-900 border-t border-gray-200 pt-3">
                <span>Total</span>
                <span>${summary.breakdown.total}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-sm disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Pay Now"}
          </button>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mt-4">
              {error}
            </p>
          )}
        </form>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500">
        🔒 Payments are securely processed via Stripe
      </footer>

      {/* ✅ Success Popup */}
      {success && (
        <div className="absolute inset-0 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-fade-in">
            <div className="text-green-600 text-5xl mb-3">✅</div>
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Redirecting to home in <span className="font-semibold">{countdown}</span>...
            </p>
            <p className="text-sm text-gray-400">Thank you for your purchase 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
}
