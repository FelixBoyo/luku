import { useState } from 'react';
import { ArrowLeft, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


export function Payment() {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  // Mock order total
  const orderTotal = 12400;

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvv(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/order-confirmation');
    }, 2000);
  };

  const isFormValid = cardNumber.replace(/\s/g, '').length === 16 &&
    expiryDate.length === 5 &&
    cvv.length === 3 &&
    cardName.length > 0;

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Header */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <Link to="/cart">
          <button className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </Link>
        <h1 className="text-white text-3xl font-black tracking-tight mb-2">PAYMENT</h1>
        <p className="text-white/70 text-sm font-semibold">Secure checkout powered by Stripe</p>
      </div>

      {/* Security Banner */}
      <div className="px-6 pt-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#48CD8A]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-[#48CD8A]" strokeWidth={2.5} />
          </div>
          <p className="text-white/70 text-sm font-semibold">
            Your payment information is encrypted and secure
          </p>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="px-6 pt-6">
        {/* Card Number */}
        <div className="mb-5">
          <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
            Card Number
          </label>
          <div className="relative">
            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" strokeWidth={2.5} />
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>
        </div>

        {/* Expiry and CVV */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              Expiry Date
            </label>
            <input
              type="text"
              value={expiryDate}
              onChange={handleExpiryChange}
              placeholder="MM/YY"
              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>
          <div>
            <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
              CVV
            </label>
            <input
              type="text"
              value={cvv}
              onChange={handleCvvChange}
              placeholder="123"
              className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="mb-5">
          <label className="text-white text-sm font-black mb-2 block uppercase tracking-wide">
            Cardholder Name
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="Name on card"
            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
          />
        </div>

        {/* Save Card Checkbox */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="w-5 h-5 bg-white/10 border-2 border-white/20 rounded checked:bg-[#48CD8A] checked:border-[#48CD8A] cursor-pointer"
            />
            <span className="text-white text-sm font-semibold">
              Save card for future purchases
            </span>
          </label>
        </div>

        {/* Order Total */}
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/70 text-sm font-semibold">Subtotal</p>
            <p className="text-white text-sm font-bold">
              KES {(orderTotal - 1000).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/70 text-sm font-semibold">Shipping</p>
            <p className="text-white text-sm font-bold">KES 1,000</p>
          </div>
          <div className="border-t border-white/20 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-white text-lg font-black">Total</p>
              <p className="text-[#48CD8A] text-2xl font-black">
                KES {orderTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isProcessing}
          className="w-full bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black font-black text-sm py-5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide flex items-center justify-center gap-2 mb-6"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" strokeWidth={2.5} />
              Pay KES {orderTotal.toLocaleString()}
            </>
          )}
        </button>

        {/* Powered by Stripe */}
        <div className="text-center">
          <p className="text-white/40 text-xs font-semibold">
            Powered by Stripe · Your payment is secure and encrypted
          </p>
        </div>
      </form>

      <BottomNav />
    </div>
  );
}
