import { useState } from 'react';
import {
  TrendingUp, Users, Heart, Eye, DollarSign, Video,
  Image as ImageIcon, Award, Target, BarChart3, Calendar
} from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SegmentedControl } from './common/SegmentedControl';
import { SectionCard } from './common/SectionCard';
import { StatCard, KPIRow } from './common/StatCard';

const topContent = [
  {
    id: 1,
    type: 'outfit',
    title: 'MINIMAL_SPRING_LOOK',
    views: 12400,
    likes: 1240,
    saves: 560,
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    date: '2026-05-15',
  },
  {
    id: 2,
    type: 'outfit',
    title: 'LAYERED_NEUTRALS',
    views: 9800,
    likes: 980,
    saves: 420,
    thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    date: '2026-05-12',
  },
  {
    id: 3,
    type: 'moodboard',
    title: 'EARTH_TONES_CAPSULE',
    views: 8600,
    likes: 860,
    saves: 380,
    thumbnail: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
    date: '2026-05-10',
  },
];

const followers = [
  {
    name: 'Sarah Chen',
    avatar: 'SC',
    joined: '2d ago',
    engagement: 'high',
  },
  {
    name: 'Marcus Johnson',
    avatar: 'MJ',
    joined: '3d ago',
    engagement: 'medium',
  },
  {
    name: 'Elena Rodriguez',
    avatar: 'ER',
    joined: '5d ago',
    engagement: 'high',
  },
];

export function CreatorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div
      className="min-h-screen w-full bg-black overflow-auto pb-24"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="inline-block mb-4">
          <h1 className="text-white text-4xl font-black tracking-tight relative">
            CREATOR_HUB
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#48CD8A] rounded-full"></span>
          </h1>
        </div>
        <p className="text-white/70 text-sm font-bold">@shannon_style</p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <SegmentedControl
          segments={[
            { label: 'Overview', value: 'overview', icon: <BarChart3 className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Content', value: 'content', icon: <ImageIcon className="w-4 h-4" strokeWidth={3} />, badge: 24 },
            { label: 'Audience', value: 'audience', icon: <Users className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Analytics', value: 'analytics', icon: <TrendingUp className="w-4 h-4" strokeWidth={3} /> },
            { label: 'Earnings', value: 'earnings', icon: <DollarSign className="w-4 h-4" strokeWidth={3} /> },
          ]}
          activeSegment={activeTab}
          onChange={setActiveTab}
          variant="compact"
        />
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="px-6 space-y-6">
          {/* KPI Row */}
          <KPIRow
            items={[
              { label: 'FOLLOWERS', value: '3.2K', highlight: true },
              { label: 'VIEWS', value: '42K' },
              { label: 'ENGAGEMENT', value: '12%' },
            ]}
          />

          {/* Growth Stats */}
          <SectionCard title="GROWTH_METRICS" variant="elevated">
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="NEW_FOLLOWERS"
                value="+142"
                change="+18%"
                trend="up"
                icon={<Users className="w-5 h-5" strokeWidth={3} />}
                variant="highlight"
                size="compact"
              />
              <StatCard
                label="AVG_VIEWS"
                value="1.8K"
                change="+24%"
                trend="up"
                icon={<Eye className="w-5 h-5" strokeWidth={3} />}
                size="compact"
              />
              <StatCard
                label="LIKES"
                value="4.2K"
                change="+12%"
                trend="up"
                icon={<Heart className="w-5 h-5" strokeWidth={3} />}
                size="compact"
              />
              <StatCard
                label="SAVES"
                value="1.6K"
                change="+8%"
                trend="up"
                icon={<Award className="w-5 h-5" strokeWidth={3} />}
                size="compact"
              />
            </div>
          </SectionCard>

          {/* Top Content */}
          <SectionCard
            title="TOP_CONTENT"
            subtitle="Last 30 days"
            headerCTA={{
              label: 'View All',
              onClick: () => setActiveTab('content'),
            }}
          >
            <div className="space-y-3">
              {topContent.map((content) => (
                <div
                  key={content.id}
                  className="flex gap-3 p-3 bg-black rounded-lg border-2 border-white/10"
                >
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-black text-sm mb-2">{content.title}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{(content.views / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{content.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#48CD8A]" strokeWidth={3} />
                        <span className="text-white/70 font-black">{content.saves}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Activity */}
          <SectionCard title="RECENT_ACTIVITY" variant="gradient">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
                <span className="text-white/70 font-semibold">
                  <strong className="text-black">Sarah Chen</strong> started following you
                </span>
                <span className="ml-auto text-white/50 text-xs font-bold">2h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Heart className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
                <span className="text-white/70 font-semibold">
                  Your outfit got <strong className="text-black">24 new likes</strong>
                </span>
                <span className="ml-auto text-white/50 text-xs font-bold">5h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Award className="w-4 h-4 text-[#48CD8A]" strokeWidth={3} />
                <span className="text-white/70 font-semibold">
                  Reached <strong className="text-black">3K followers</strong> milestone
                </span>
                <span className="ml-auto text-white/50 text-xs font-bold">1d ago</span>
              </div>
            </div>
          </SectionCard>

          {/* Goals */}
          <SectionCard title="GOALS" variant="muted">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white text-sm font-bold">Reach 5K Followers</span>
                  <span className="text-white font-black text-sm">3,200 / 5,000</span>
                </div>
                <div className="w-full h-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#48CD8A] rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-white text-sm font-bold">100K Monthly Views</span>
                  <span className="text-white font-black text-sm">42K / 100K</span>
                </div>
                <div className="w-full h-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3AB87A] rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="px-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="TOTAL"
              value="24"
              icon={<ImageIcon className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
              size="compact"
            />
            <StatCard
              label="THIS_WEEK"
              value="3"
              icon={<Calendar className="w-5 h-5" strokeWidth={3} />}
              size="compact"
            />
            <StatCard
              label="DRAFTS"
              value="2"
              size="compact"
            />
          </div>

          {/* Content Performance */}
          <SectionCard title="CONTENT_PERFORMANCE" variant="elevated">
            <div className="space-y-3">
              {topContent.map((content, idx) => (
                <div
                  key={content.id}
                  className="p-4 bg-black rounded-lg border-2 border-white/10"
                >
                  <div className="flex gap-3 mb-3">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={content.thumbnail} alt={content.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-black text-sm">{content.title}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-black ${
                            idx === 0
                              ? 'bg-[#48CD8A] text-black'
                              : 'bg-white text-white/70 border-2 border-white/10'
                          }`}
                        >
                          {content.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs font-semibold mb-2">Posted {content.date}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded border-2 border-white/10">
                          <p className="text-white font-black text-base">{(content.views / 1000).toFixed(1)}K</p>
                          <p className="text-white/60 text-xs font-semibold">Views</p>
                        </div>
                        <div className="text-center p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded border-2 border-white/10">
                          <p className="text-white font-black text-base">{content.likes}</p>
                          <p className="text-white/60 text-xs font-semibold">Likes</p>
                        </div>
                        <div className="text-center p-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded border-2 border-white/10">
                          <p className="text-white font-black text-base">{content.saves}</p>
                          <p className="text-white/60 text-xs font-semibold">Saves</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-white text-white font-black text-xs rounded-lg border-2 border-white/10 hover:bg-white/5 transition-colors">
                      EDIT
                    </button>
                    <button className="flex-1 py-2 bg-white text-white font-black text-xs rounded-lg border-2 border-white/10 hover:bg-white/5 transition-colors">
                      INSIGHTS
                    </button>
                    <button className="flex-1 py-2 bg-white text-white font-black text-xs rounded-lg border-2 border-white/10 hover:bg-white/5 transition-colors">
                      SHARE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Content Calendar */}
          <SectionCard title="UPCOMING_POSTS" variant="gradient">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <div className="w-12 h-12 bg-[#48CD8A] rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg font-black">22</span>
                  <span className="text-white text-xs font-black">MAY</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black text-sm mb-1">Weekend Capsule</h4>
                  <p className="text-white/70 text-xs font-semibold">Scheduled for 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex flex-col items-center justify-center flex-shrink-0 border-2 border-white/10">
                  <span className="text-white text-lg font-black">25</span>
                  <span className="text-white text-xs font-black">MAY</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black text-sm mb-1">Color Theory Guide</h4>
                  <p className="text-white/70 text-xs font-semibold">Draft</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Audience Tab */}
      {activeTab === 'audience' && (
        <div className="px-6 space-y-6">
          {/* Follower Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="FOLLOWERS"
              value="3,200"
              change="+142"
              trend="up"
              icon={<Users className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
            />
            <StatCard
              label="FOLLOWING"
              value="280"
              icon={<Users className="w-5 h-5" strokeWidth={3} />}
            />
          </div>

          {/* Follower Growth */}
          <SectionCard title="FOLLOWER_GROWTH" subtitle="Last 7 days" variant="elevated">
            <div className="space-y-3">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                const followers = [18, 24, 16, 32, 28, 36, 42];
                const max = Math.max(...followers);
                const percentage = (followers[idx] / max) * 100;
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-white/70 text-xs font-black w-8">{day}</span>
                    <div className="flex-1 bg-black rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-[#48CD8A] h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-black w-12 text-right">
                      +{followers[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Audience Demographics */}
          <SectionCard title="DEMOGRAPHICS" variant="gradient">
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-black text-sm mb-3">Age Range</h4>
                {[
                  { range: '18-24', percentage: 32 },
                  { range: '25-34', percentage: 45 },
                  { range: '35-44', percentage: 18 },
                  { range: '45+', percentage: 5 },
                ].map((age) => (
                  <div key={age.range} className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-white text-sm font-bold">{age.range}</span>
                      <span className="text-white font-black text-sm">{age.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3AB87A] rounded-full"
                        style={{ width: `${age.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Recent Followers */}
          <SectionCard title="RECENT_FOLLOWERS" variant="muted">
            <div className="space-y-3">
              {followers.map((follower, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#48CD8A] to-[#3AB87A] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                    <span className="text-white font-black text-sm">{follower.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-black text-sm">{follower.name}</h4>
                    <p className="text-white/70 text-xs font-semibold">Joined {follower.joined}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-black ${
                      follower.engagement === 'high'
                        ? 'bg-[#48CD8A] text-black'
                        : 'bg-white/5 text-white/70'
                    }`}
                  >
                    {follower.engagement.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="px-6 space-y-6">
          {/* Overview Metrics */}
          <KPIRow
            items={[
              { label: 'REACH', value: '42K' },
              { label: 'ENGAGEMENT', value: '12%', highlight: true },
              { label: 'SAVES', value: '1.6K' },
            ]}
          />

          {/* Engagement Rate */}
          <SectionCard title="ENGAGEMENT_RATE" subtitle="Last 30 days" variant="elevated">
            <div className="space-y-3">
              {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, idx) => {
                const rates = [9.5, 11.2, 10.8, 12.4];
                const max = Math.max(...rates);
                const percentage = (rates[idx] / max) * 100;
                return (
                  <div key={week}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white text-sm font-bold">{week}</span>
                      <span className="text-white font-black text-sm">{rates[idx]}%</span>
                    </div>
                    <div className="w-full h-3 bg-black rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#48CD8A] rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Content Performance */}
          <SectionCard title="CONTENT_TYPES" variant="gradient">
            <div className="space-y-3">
              {[
                { type: 'Outfit Posts', percentage: 65 },
                { type: 'Mood Boards', percentage: 25 },
                { type: 'Style Tips', percentage: 10 },
              ].map((content) => (
                <div key={content.type} className="flex items-center justify-between">
                  <span className="text-white text-sm font-bold">{content.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3AB87A] rounded-full"
                        style={{ width: `${content.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-black text-sm w-10 text-right">
                      {content.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Peak Times */}
          <SectionCard title="BEST_POST_TIMES" variant="muted">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <span className="text-white font-bold text-sm">Weekday Mornings</span>
                <span className="text-white font-black text-sm">9-11 AM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                <span className="text-white font-bold text-sm">Weekend Afternoons</span>
                <span className="text-white font-black text-sm">2-4 PM</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="px-6 space-y-6">
          {/* Earnings Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="THIS_MONTH"
              value="$1,240"
              change="+18%"
              trend="up"
              icon={<DollarSign className="w-5 h-5" strokeWidth={3} />}
              variant="highlight"
            />
            <StatCard
              label="TOTAL"
              value="$6,820"
              icon={<TrendingUp className="w-5 h-5" strokeWidth={3} />}
            />
          </div>

          {/* Revenue Breakdown */}
          <SectionCard title="REVENUE_SOURCES" variant="elevated">
            <div className="space-y-3">
              {[
                { source: 'Affiliate Sales', amount: 680, percentage: 55 },
                { source: 'Sponsored Content', amount: 420, percentage: 34 },
                { source: 'Tips & Donations', amount: 140, percentage: 11 },
              ].map((revenue) => (
                <div key={revenue.source}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white text-sm font-bold">{revenue.source}</span>
                    <span className="text-white font-black text-sm">${revenue.amount}</span>
                  </div>
                  <div className="w-full h-3 bg-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#48CD8A] rounded-full"
                      style={{ width: `${revenue.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Monthly Earnings */}
          <SectionCard title="MONTHLY_EARNINGS" variant="gradient">
            <div className="space-y-3">
              {['January', 'February', 'March', 'April', 'May'].map((month, idx) => {
                const earnings = [980, 1140, 1280, 1120, 1240];
                return (
                  <div key={month} className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg border-2 border-white/10">
                    <span className="text-white text-sm font-bold">{month}</span>
                    <span className="text-white font-black text-base">${earnings[idx]}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Payout Info */}
          <SectionCard title="PAYOUT_INFO" variant="muted">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-black/80 text-sm font-bold">Available Balance</span>
                <span className="text-white text-2xl font-black">$1,240</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black/80 text-sm font-bold">Next Payout</span>
                <span className="text-white text-lg font-black">June 1</span>
              </div>
              <button className="w-full py-3 bg-white text-black font-black text-sm rounded-lg hover:bg-[#1A1A1A] transition-colors mt-3">
                REQUEST_PAYOUT
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
