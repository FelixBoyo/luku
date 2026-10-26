import { useState } from 'react';
import { Search, MoreVertical, Star, Archive, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { BottomNav } from './BottomNav';
import { TopNav } from './TopNav';


type Message = {
  id: number;
  sender: string;
  preview: string;
  time: string;
  unread: boolean;
  avatar: string;
};

const messages: Message[] = [
  {
    id: 1,
    sender: 'ChicBoutique',
    preview: 'Your order has been shipped! Track your package...',
    time: '2m',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  },
  {
    id: 2,
    sender: 'VintageVibes',
    preview: 'Thanks for your purchase! We hope you love...',
    time: '1h',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
  },
  {
    id: 3,
    sender: 'LUKU Support',
    preview: 'Welcome to LUKU! Here are some tips to get started...',
    time: '3h',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
  {
    id: 4,
    sender: 'StyleMaven',
    preview: 'Is this item still available? I\'d love to...',
    time: '1d',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
];

export function Inbox() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24 pt-16"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Top Navigation */}
      <TopNav cartItemCount={3} inboxUnreadCount={2} />

      {/* Side Drawer */}

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-white text-5xl font-black tracking-tighter leading-none mb-4">
          INBOX
        </h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 pl-12 pr-4 py-3 rounded-full text-white font-semibold placeholder:text-white/40 focus:outline-none focus:border-[#48CD8A] transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {['All', 'Unread', 'Archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wide transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="px-6 pt-6 space-y-3">
        {messages.map((message) => (
          <Link key={message.id} to={`/conversation/${message.id}`}>
            <div
              className={`p-4 rounded-xl border transition-all hover:bg-white/5 cursor-pointer relative ${
                message.unread
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                  <img
                    src={message.avatar}
                    alt={message.sender}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-white font-black text-sm truncate">
                      {message.sender}
                    </h3>
                    <span className="text-white/60 text-xs font-semibold ml-2">
                      {message.time}
                    </span>
                  </div>
                  <p
                    className={`text-sm font-semibold truncate ${
                      message.unread ? 'text-white/90' : 'text-white/60'
                    }`}
                  >
                    {message.preview}
                  </p>
                </div>

                {/* Actions */}
                <button 
                  onClick={(e) => e.preventDefault()}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-white/40" strokeWidth={2.5} />
                </button>
              </div>

              {message.unread && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-[#48CD8A] rounded-full"></div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State (if no messages) */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Star className="w-10 h-10 text-white/40" strokeWidth={2} />
          </div>
          <p className="text-white text-lg font-black mb-2">No Messages</p>
          <p className="text-white/60 text-sm font-semibold">
            Your inbox is empty
          </p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
