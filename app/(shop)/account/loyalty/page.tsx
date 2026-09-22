import { Gift, Crown, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LoyaltyPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Loyalty Rewards</h1>
        <p className="text-muted-foreground">Earn points and unlock exclusive benefits</p>
      </div>

      {/* Current Tier */}
      <Card className="mb-8 border-[#B88E2F]/20 bg-gradient-to-r from-[#B88E2F]/5 to-[#B88E2F]/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="size-16 rounded-full bg-[#B88E2F] flex items-center justify-center">
              <Crown className="size-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#111827]">Gold Member</h2>
              <p className="text-muted-foreground">2,840 points</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div className="bg-[#B88E2F] h-3 rounded-full transition-all" style={{ width: '56.8%' }} />
          </div>
          <p className="text-sm text-muted-foreground">2,160 points to Platinum</p>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <TierCard
          tier="Standard"
          points={0}
          benefits={[
            '1 point per $1 spent',
            'Birthday discount',
            'Free shipping on orders over $100',
          ]}
          current={false}
        />
        <TierCard
          tier="Gold"
          points={2500}
          benefits={[
            '1.25 points per $1 spent',
            'Early access to sales',
            'Free shipping on all orders',
            'Exclusive jewelry previews',
          ]}
          current={true}
        />
        <TierCard
          tier="Platinum"
          points={5000}
          benefits={[
            '1.5 points per $1 spent',
            'Personal stylist access',
            'Free express shipping',
            'Exclusive limited edition pieces',
            'VIP event invitations',
          ]}
          current={false}
        />
      </div>

      {/* How to Earn */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-[#111827] mb-4">How to Earn Points</h3>
          <div className="space-y-4">
            <EarningMethod points={100} description="Create an account" />
            <EarningMethod points={500} description="Make your first purchase" />
            <EarningMethod points={1} description="Per $1 spent" />
            <EarningMethod points={50} description="Leave a product review" />
            <EarningMethod points={200} description="Refer a friend" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TierCard({ tier, points, benefits, current }: { tier: string; points: number; benefits: string[]; current: boolean }) {
  return (
    <Card className={`border-2 ${current ? 'border-[#B88E2F]' : 'border-primary/10'}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {current && <Star className="size-5 text-[#B88E2F] fill-current" />}
          <h3 className="text-lg font-semibold text-[#111827]">{tier}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{points.toLocaleString()}+ points</p>
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="text-sm flex items-start gap-2">
              <span className="text-[#B88E2F] mt-1">•</span>
              <span className={current ? 'text-[#111827]' : 'text-muted-foreground'}>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function EarningMethod({ points, description }: { points: number; description: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#F8F7F5] rounded-lg">
      <div className="flex items-center gap-3">
        <Gift className="size-5 text-[#B88E2F]" />
        <span className="text-[#111827]">{description}</span>
      </div>
      <span className="font-semibold text-[#B88E2F]">+{points} pts</span>
    </div>
  )
}
