"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReminderFormProps {
  onAdd: (data: { type: string; date: string; recipientName: string }) => Promise<void>;
}

export function ReminderForm({ onAdd }: ReminderFormProps) {
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !date || !recipientName) return;

    setIsSubmitting(true);
    try {
      await onAdd({ type, date, recipientName });
      setType('');
      setDate('');
      setRecipientName('');
    } catch (error) {
      console.error('Failed to add reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Occasion</Label>
          <Select value={type} onValueChange={(v) => setType(v || '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select occasion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="anniversary">Anniversary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Name</Label>
          <Input
            id="recipient"
            type="text"
            placeholder="e.g., Mom, John"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !type || !date || !recipientName}
        className="w-full md:w-auto"
      >
        {isSubmitting ? 'Adding...' : 'Add Reminder'}
      </Button>
    </form>
  );
}
