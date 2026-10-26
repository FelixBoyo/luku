import { useState } from 'react';
import {
  ShoppingBag, CreditCard, MapPin, CheckCircle, X,
  Plus, Minus, Trash2, ChevronRight, ChevronLeft, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';
import { SectionCard } from './common/SectionCard';
import { KPIRow } from './common/StatCard';

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  seller: string;
  size?: string;
  color?: string;
};

const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: 'Structured Handbag',
    price: 145,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=200',
    seller: 'Essential Leather Co.',
    color: 'Camel',
  },
  {
    id: 2,
    name: 'Classic Watch',
    price: 220,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200',
    seller: 'Timeless Accessories',
    color: 'Silver',
  },
  {
    id: 3,
    name: 'Silk Scarf',
    price: 85,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1764697907673-eaba1d06205a?w=200',
    seller: 'Essential Leather Co.',
    color: 'Beige',
  },
];

export function CartCheckout() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'complete'>('cart');
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = shippingMethod === 'express' ? 15 : 5;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const steps = [
    { key: 'cart', label: 'Cart', icon: ShoppingBag },
    { key: 'shipping', label: 'Shipping', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => step === 'cart' ? navigate(-1) : setStep(steps[currentStepIndex - 1].key as any)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <h1 className="text-white text-base font-black uppercase tracking-widest">Checkout</h1>
          <p className="text-white/50 text-[10px] font-semibold">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · ${total.toFixed(2)} total
          </p>
        </div>
        <div className="w-9" />
      </div>

      {/* Stepper */}
      <div className="px-6 pt-6 mb-8">
        <div className="relative flex items-start justify-between">
          {/* Connector lines behind icons */}
          <div className="absolute top-5 left-0 right-0 flex px-5">
            {steps.slice(0, -1).map((_, idx) => (
              <div key={idx} className="flex-1 flex items-center">
                <div className={`flex-1 h-px ${idx < currentStepIndex ? 'bg-[#48CD8A]' : 'bg-white/15'}`} />
              </div>
            ))}
          </div>

          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center" style={{ width: '25%' }}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-[#48CD8A] text-black'
                      : isActive
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/40 border border-white/20'
                  }`}
                >
                  <StepIcon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <p className={`text-[10px] font-black mt-2 uppercase tracking-wide text-center ${isActive ? 'text-white' : 'text-white/40'}`}>
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Step */}
      {step === 'cart' && (
        <div className="px-6 space-y-6">
          <SectionCard title="ITEMS" badge={cartItems.length} variant="elevated">
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10"
                >
                  <div className="w-20 h-20 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black text-sm mb-1 truncate">{item.name}</h3>
                    <p className="text-white/70 text-xs font-semibold mb-1">{item.seller}</p>
                    {item.color && (
                      <p className="text-white/60 text-xs font-semibold">{item.color}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 bg-white/10 backdrop-blur-sm border border-white/10 rounded-md flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-white" strokeWidth={3} />
                      </button>
                      <span className="text-white font-black text-sm w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 bg-white/10 backdrop-blur-sm border border-white/10 rounded-md flex items-center justify-center hover:bg-white/20 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-lg">${item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="ORDER SUMMARY" variant="gradient">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-bold">Subtotal</span>
                <span className="text-white text-lg font-black">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-bold">Shipping</span>
                <span className="text-white text-lg font-black">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm font-bold">Tax</span>
                <span className="text-white text-lg font-black">${tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-white text-base font-black">Total</span>
                <span className="text-white text-2xl font-black">${total.toFixed(2)}</span>
              </div>
            </div>
          </SectionCard>

          <button
            onClick={() => setStep('shipping')}
            disabled={cartItems.length === 0}
            className="w-full py-4 bg-white text-black font-black text-base rounded-lg hover:bg-[#FAFAFA] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            PROCEED TO SHIPPING
            <ChevronRight className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Shipping Step */}
      {step === 'shipping' && (
        <div className="px-6 space-y-6">
          <SectionCard title="SHIPPING ADDRESS" variant="elevated">
            <div className="space-y-3">
              <div>
                <label className="text-white text-sm font-black mb-2 block">FULL NAME</label>
                <input
                  type="text"
                  defaultValue="Shannon Martinez"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white text-sm font-black mb-2 block">ADDRESS</label>
                <input
                  type="text"
                  defaultValue="123 Main Street"
                  className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white text-sm font-black mb-2 block">CITY</label>
                  <input
                    type="text"
                    defaultValue="San Francisco"
                    className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-black mb-2 block">ZIP</label>
                  <input
                    type="text"
                    defaultValue="94103"
                    className="w-full px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="SHIPPING METHOD" variant="gradient">
            <div className="space-y-3">
              <button
                onClick={() => setShippingMethod('standard')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  shippingMethod === 'standard'
                    ? 'bg-[#48CD8A]/10 border-[#48CD8A]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-black text-sm">Standard Shipping</p>
                    <p className="text-white/70 text-xs font-semibold">5-7 business days</p>
                  </div>
                  <p className="text-white font-black text-lg">$5.00</p>
                </div>
              </button>
              <button
                onClick={() => setShippingMethod('express')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  shippingMethod === 'express'
                    ? 'bg-[#48CD8A]/10 border-[#48CD8A]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-black text-sm">Express Shipping</p>
                    <p className="text-white/70 text-xs font-semibold">2-3 business days</p>
                  </div>
                  <p className="text-white font-black text-lg">$15.00</p>
                </div>
              </button>
            </div>
          </SectionCard>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('cart')}
              className="flex-1 py-4 bg-white/10 text-white font-black text-base rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              BACK
            </button>
            <button
              onClick={() => setStep('payment')}
              className="flex-1 py-4 bg-white text-black font-black text-base rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              CONTINUE
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      {/* Payment Step */}
      {step === 'payment' && (
        <div className="px-6 space-y-6">
          <SectionCard title="PAYMENT METHOD" variant="elevated">
            <div className="space-y-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === 'card'
                    ? 'bg-[#48CD8A]/10 border-[#48CD8A]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-black" strokeWidth={3} />
                  <div>
                    <p className="text-white font-black text-sm">Credit / Debit Card</p>
                    <p className="text-white/70 text-xs font-semibold">Visa, Mastercard, Amex</p>
                  </div>
                </div>
              </button>
            </div>
          </SectionCard>

          {paymentMethod === 'card' && (
            <SectionCard title="CARD DETAILS" variant="gradient">
              <div className="space-y-3">
                <div>
                  <label className="text-white text-sm font-black mb-2 block">CARD NUMBER</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 bg-black/40 border-2 border-white/10 rounded-lg text-white font-semibold placeholder:text-white/30 focus:border-[#48CD8A] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white text-sm font-black mb-2 block">EXPIRY</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-black/40 border-2 border-white/10 rounded-lg text-white font-semibold placeholder:text-white/30 focus:border-[#48CD8A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm font-black mb-2 block">CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-3 bg-black/40 border-2 border-white/10 rounded-lg text-white font-semibold placeholder:text-white/30 focus:border-[#48CD8A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          <SectionCard title="ORDER TOTAL" variant="muted">
            <div className="text-center py-4">
              <p className="text-white/70 text-sm font-bold mb-2">Total Amount</p>
              <p className="text-white text-4xl font-black">${total.toFixed(2)}</p>
            </div>
          </SectionCard>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('shipping')}
              className="flex-1 py-4 bg-white text-white font-black text-base rounded-lg border-2 border-white/10 hover:bg-black transition-colors"
            >
              BACK
            </button>
            <button
              onClick={() => setStep('complete')}
              className="flex-1 py-4 bg-white text-black font-black text-base rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" strokeWidth={3} />
              PLACE ORDER
            </button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="px-6">
          <SectionCard variant="elevated">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-[#48CD8A] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/20 outline outline-4 outline-offset-2 outline-[#48CD8A]/30">
                <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <h2 className="text-white text-3xl font-black mb-3">ORDER CONFIRMED!</h2>
              <p className="text-white/70 text-base font-semibold mb-6">
                Thank you for your purchase. Your order #ORD-2848 has been confirmed.
              </p>
              <div className="bg-black rounded-lg p-4 mb-6 border-2 border-white/10">
                <p className="text-white text-sm font-bold mb-2">Estimated Delivery</p>
                <p className="text-white text-2xl font-black">May 24-26, 2026</p>
              </div>
              <div className="space-y-3">
                <button className="w-full py-4 bg-white text-black font-black text-base rounded-lg hover:bg-white/90 transition-colors">
                  TRACK ORDER
                </button>
                <button
                  onClick={() => {
                    setStep('cart');
                    setCartItems(initialCartItems);
                  }}
                  className="w-full py-4 bg-white/10 text-white font-black text-base rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
}