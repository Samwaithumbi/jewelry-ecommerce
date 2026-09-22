import { Users, Gift, Copy, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReferralsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Referrals</h1>
        <p className="text-muted-foreground">Share the love and earn rewards</p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Referrals" value="4" icon={Users} />
        <StatCard title="Successful Referrals" value="3" icon={Check} />
        <StatCard title="Total Earned" value="$200" icon={Gift} />
      </div>

      {/* Referral Code */}
      <Card className="mb-8 border-[#B88E2F]/20 bg-gradient-to-r from-[#B88E2F]/5 to-[#B88E2F]/10">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-[#111827] mb-2">Your Referral Code</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share this code with friends and they'll get $50 off their first order. You'll get $50 when they make a purchase!
          </p>
          <div className="flex gap-3">
            <div className="flex-1 bg-white border border-primary/20 rounded-lg px-4 py-3 font-mono text-lg">
              ALEXANDRA50
            </div>
            <Button className="bg-[#B88E2F] text-white hover:bg-[#B88E2F]/90">
              <Copy className="size-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-[#111827] mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              step={1}
              title="Share Your Code"
              description="Send your unique referral code to friends via email, social media, or text."
            />
            <StepCard
              step={2}
              title="They Save $50"
              description="Your friends get $50 off their first purchase when they use your code."
            />
            <StepCard
              step={3}
              title="You Earn $50"
              description="Once they make a purchase, you'll receive $50 in store credit."
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-[#111827] mb-4">Recent Referrals</h3>
          <div className="space-y-4">
            <ReferralItem
              name="Sarah Johnson"
              date="March 15, 2024"
              status="Completed"
              earned="$50"
            />
            <ReferralItem
              name="Michael Chen"
              date="March 10, 2024"
              status="Completed"
              earned="$50"
            />
            <ReferralItem
              name="Emily Davis"
              date="March 5, 2024"
              status="Completed"
              earned="$50"
            />
            <ReferralItem
              name="James Wilson"
              date="February 28, 2024"
              status="Pending"
              earned="$50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-10 rounded-lg bg-[#B88E2F]/10 flex items-center justify-center">
            <Icon className="size-5 text-[#B88E2F]" />
          </div>
          <h3 className="text-sm text-muted-foreground">{title}</h3>
        </div>
        <p className="text-2xl font-bold text-[#111827]">{value}</p>
      </CardContent>
    </Card>
  )
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="size-12 rounded-full bg-[#B88E2F] text-white flex items-center justify-center mx-auto mb-3 text-xl font-bold">
        {step}
      </div>
      <h4 className="font-semibold text-[#111827] mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function ReferralItem({ name, date, status, earned }: { name: string; date: string; status: string; earned: string }) {
  const statusColors = {
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="flex items-center justify-between p-4 bg-[#F8F7F5] rounded-lg border border-primary/5">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full bg-[#B88E2F]/10 flex items-center justify-center">
          <Users className="size-5 text-[#B88E2F]" />
        </div>
        <div>
          <p className="font-medium text-[#111827]">{name}</p>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
          {status}
        </span>
        <span className="font-semibold text-[#B88E2F]">{earned}</span>
      </div>
    </div>
  )
}
