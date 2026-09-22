import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getReminders, addReminder, removeReminder } from '@/app/actions/reminders/manage-reminders';
import { ReminderForm } from '@/app/(shop)/account/settings/reminder-form';
import { revalidatePath } from 'next/cache';

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/sign_in?callbackUrl=/account/settings');
  }

  const reminders = await getReminders();

  async function handleAddReminder(data: { type: string; date: string; recipientName: string }) {
    'use server';
    await addReminder(data.type, data.date, data.recipientName);
    revalidatePath('/account/settings');
  }

  async function handleRemoveReminder(reminderId: string) {
    'use server';
    await removeReminder(reminderId);
    revalidatePath('/account/settings');
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and reminders</p>
      </div>

      {/* Reminders Section */}
      <div className="bg-white rounded-xl shadow-sm border border-primary/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#111827] mb-1">Gift Reminders</h2>
            <p className="text-sm text-muted-foreground">
              Never miss a special occasion. We'll send you an email 3 weeks before each date.
            </p>
          </div>
        </div>

        <ReminderForm onAdd={handleAddReminder} />

        {reminders.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Your Reminders</h3>
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-4 bg-[#FCFBF9] rounded-lg border border-primary/5"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-[#B88E2F]/10 flex items-center justify-center">
                    {reminder.type === 'birthday' ? (
                      <svg className="size-5 text-[#B88E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="size-5 text-[#B88E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#111827]">{reminder.recipientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {reminder.type === 'birthday' ? 'Birthday' : 'Anniversary'} • {new Date(reminder.reminderDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveReminder(reminder.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                  title="Remove reminder"
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
