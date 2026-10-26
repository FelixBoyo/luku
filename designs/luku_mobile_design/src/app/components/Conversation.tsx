import { useState } from 'react';
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { Link } from 'react-router';

type Message = {
  id: number;
  sender: 'me' | 'them';
  content: string;
  timestamp: string;
};

export function Conversation() {
  const [message, setMessage] = useState('');

  // Mock data - would come from route params
  const listing = {
    id: 1,
    name: 'Vintage Denim Jacket',
    price: 8900,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    seller: 'VintageVibes',
  };

  const conversation: Message[] = [
    {
      id: 1,
      sender: 'them',
      content: 'Hi! Is this item still available?',
      timestamp: '10:30 AM',
    },
    {
      id: 2,
      sender: 'me',
      content: 'Yes, it\'s available! Let me know if you have any questions.',
      timestamp: '10:32 AM',
    },
    {
      id: 3,
      sender: 'them',
      content: 'Great! Can you tell me more about the condition?',
      timestamp: '10:35 AM',
    },
    {
      id: 4,
      sender: 'me',
      content: 'It\'s in excellent condition, barely worn. No visible signs of wear.',
      timestamp: '10:37 AM',
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-lg border-b border-white/10 px-6 py-4 flex items-center gap-4 z-10">
        <Link to="/inbox">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-lg">
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
        </Link>

        <Link to="/user/user1" className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
            <img
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200"
              alt={listing.seller}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-black truncate">{listing.seller}</p>
            <p className="text-white/60 text-xs font-semibold">Active now</p>
          </div>
        </Link>

        <button className="w-10 h-10 flex items-center justify-center hover:bg-white/10 transition-colors rounded-lg">
          <MoreVertical className="w-6 h-6 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Listing Context */}
      <Link to={`/product/${listing.id}`}>
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4 mx-6 mt-4 rounded-xl hover:bg-white/15 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
              <img
                src={listing.imageUrl}
                alt={listing.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-bold mb-1 truncate">{listing.name}</p>
              <p className="text-[#48CD8A] text-lg font-black">
                KES {listing.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {conversation.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  msg.sender === 'me'
                    ? 'bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] text-black'
                    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
                }`}
              >
                <p className="text-sm font-semibold leading-relaxed">{msg.content}</p>
              </div>
              <p className={`text-xs font-semibold mt-1 ${
                msg.sender === 'me' ? 'text-[#48CD8A]/70' : 'text-white/60'
              }`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-black/90 backdrop-blur-lg border-t border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
            <ImageIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="w-full px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-12 h-12 bg-gradient-to-r from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}