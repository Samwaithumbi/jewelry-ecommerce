'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from '@/components/shop/photo-upload';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';

export default function CustomOrderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    metalPreference: '',
    timeline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budgetMinCents: formData.budgetMin ? parseInt(formData.budgetMin) * 100 : null,
          budgetMaxCents: formData.budgetMax ? parseInt(formData.budgetMax) * 100 : null,
          photoUrls: photos,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSuccess(true);
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="border-[#B88E2F]/20">
          <CardContent className="py-16 text-center">
            <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="size-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif font-semibold text-[#111827] mb-4">
              Request Submitted
            </h1>
            <p className="text-muted-foreground mb-8">
              Thank you for your custom jewelry request. Our expert artisans will review your submission and contact you within 24-48 hours with a personalized quote and design consultation.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-[#111827] text-white hover:bg-[#111827]/90"
            >
              Return to Shop
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-[#B88E2F]/10 text-[#B88E2F] px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="size-4" />
          Bespoke Jewelry
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-semibold text-[#111827] mb-4">
          Create Your Dream Piece
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Work with our master artisans to bring your vision to life. From concept to creation, we craft one-of-a-kind jewelry that tells your unique story.
        </p>
      </div>

      {/* Form */}
      <Card className="border-[#B88E2F]/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Custom Request Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#111827] border-b border-primary/10 pb-2">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#111827] border-b border-primary/10 pb-2">
                Design Details
              </h3>
              <div className="space-y-2">
                <Label htmlFor="description">
                  Describe Your Vision *
                  <span className="text-muted-foreground font-normal ml-2">
                    (Be as detailed as possible - metal type, gemstones, style, occasion)
                  </span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="I'd like an engagement ring with a 2ct round diamond in platinum, with a vintage-inspired setting..."
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length}/1000
                </p>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#111827] border-b border-primary/10 pb-2">
                Budget Range
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">Minimum Budget (USD)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">Maximum Budget (USD)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    placeholder="5000"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#111827] border-b border-primary/10 pb-2">
                Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metal">Metal Preference</Label>
                  <Select 
                    value={formData.metalPreference} 
                    onValueChange={(v) => setFormData({ ...formData, metalPreference: v || '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select metal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="white_gold">White Gold</SelectItem>
                      <SelectItem value="rose_gold">Rose Gold</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="not_sure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Select 
                    value={formData.timeline} 
                    onValueChange={(v) => setFormData({ ...formData, timeline: v || '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asap">ASAP</SelectItem>
                      <SelectItem value="1-2_weeks">1-2 Weeks</SelectItem>
                      <SelectItem value="1_month">1 Month</SelectItem>
                      <SelectItem value="2-3_months">2-3 Months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#111827] border-b border-primary/10 pb-2">
                Inspiration Photos
                <span className="text-muted-foreground font-normal ml-2 text-sm">
                  (Optional - Upload reference images, sketches, or inspiration)
                </span>
              </h3>
              <PhotoUpload onPhotosChange={setPhotos} maxPhotos={5} />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#111827] text-white hover:bg-[#111827]/90 text-lg font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-5 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                By submitting this form, you agree to our custom jewelry terms and conditions.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card className="border-[#B88E2F]/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-serif font-semibold text-[#B88E2F] mb-2">24-48h</div>
              <p className="text-sm text-muted-foreground">Response Time</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#B88E2F]/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-serif font-semibold text-[#B88E2F] mb-2">Free</div>
              <p className="text-sm text-muted-foreground">Design Consultation</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#B88E2F]/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-serif font-semibold text-[#B88E2F] mb-2">Lifetime</div>
              <p className="text-sm text-muted-foreground">Warranty</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
