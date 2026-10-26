import { useState } from 'react';
import { ChevronLeft, Send, Image as ImageIcon, Package } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from './BottomNav';

export function Messaging() {
  const navigate = useNavigate();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const threads = [
    { id: 1, seller: 'StyleHaven', lastMessage: 'The item is in great condition!', time: '2h ago', unread: true, productName: 'Vintage Denim Jacket', productImage: '' },
    { id: 2, seller: 'RetroCloset', lastMessage: 'Sure, I can offer 10% off', time: '1d ago', unread: false, productName: 'Leather Bag', productImage: '' },
    { id: 3, seller: 'ChicBoutique', lastMessage: 'Shipped today!', time: '2d ago', unread: false, productName: 'Summer Dress', productImage: '' },
  ];

  const messages = [
    { id: 1, sender: 'me', text: 'Hi! Is this still available?', time: '10:30 AM' },
    { id: 2, sender: 'seller', text: 'Yes, it is!', time: '10:32 AM' },
    { id: 3, sender: 'me', text: 'What condition is it in?', time: '10:33 AM' },
    { id: 4, sender: 'seller', text: 'The item is in great condition!', time: '10:35 AM' },
  ];

  const selectedThreadData = threads.find(t => t.id === selectedThread);

  if (selectedThread && selectedThreadData) {
    return (
      <div
        className="min-h-screen w-full bg-black flex flex-col"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        <div className="bg-white border-b-2 border-white/10 px-6 py-4 flex items-center gap-3">
          <button onClick={() => setSelectedThread(null)}>
            <ChevronLeft className="w-6 h-6 text-black" strokeWidth={3} />
          </button>
          <div className="flex-1">
            <p className="text-white text-lg font-black">{selectedThreadData.seller}</p>
            <p className="text-white/60 text-xs font-semibold">{selectedThreadData.productName}</p>
          </div>
        </div>

        <div className="px-6 pt-4 pb-2">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 border-2 border-white/10 flex items-center gap-3">
            <div className="w-16 h-16 bg-white/5 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-black truncate">{selectedThreadData.productName}</p>
              <p className="text-white/60 text-xs font-semibold">Sold by {selectedThreadData.seller}</p>
            </div>
            <button className="text-[#48CD8A] text-xs font-bold">View</button>
          </div>
        </div>

        <div className="flex-1 px-6 py-4 overflow-auto">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] ${message.sender === 'me' ? 'bg-white text-black' : 'bg-white text-black border-2 border-white/10'} rounded-2xl px-4 py-3`}>
                  <p className="text-sm font-semibold">{message.text}</p>
                  <p className={`text-xs font-semibold mt-1 ${message.sender === 'me' ? 'text-white/70' : 'text-white/60'}`}>
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-t-2 border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="p-2 bg-black rounded-lg border-2 border-white/10">
              <ImageIcon className="w-5 h-5 text-black" strokeWidth={2.5} />
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-black border-2 border-white/10 rounded-lg text-white font-semibold focus:border-[#48CD8A] focus:outline-none"
            />
            <button className="p-3 bg-black rounded-lg">
              <Send className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      <div className="px-6 pt-8 pb-6">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            MESSAGES
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-semibold">
          Chat with sellers and buyers
        </p>
      </div>

      <div className="px-6 pb-6">
        <div className="space-y-3">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                thread.unread
                  ? 'bg-white border-[#48CD8A] shadow-md'
                  : 'bg-white border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white/40" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white text-sm font-black">{thread.seller}</p>
                    <p className="text-white/40 text-xs font-semibold flex-shrink-0">{thread.time}</p>
                  </div>
                  <p className="text-white/60 text-xs font-semibold mb-1">{thread.productName}</p>
                  <p className="text-white/70 text-sm font-semibold truncate">{thread.lastMessage}</p>
                </div>
                {thread.unread && (
                  <div className="w-2 h-2 rounded-full bg-[#48CD8A] flex-shrink-0 mt-1"></div>
                )}
              </div>
            </button>
          ))}
        </div>

        {threads.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-black/20 mx-auto mb-3" strokeWidth={2.5} />
            <p className="text-white/60 text-sm font-semibold">No messages yet</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
