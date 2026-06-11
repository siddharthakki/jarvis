import * as fs from 'fs';
import * as path from 'path';
import { ContextManager } from '../agent/ContextManager';

interface Reminder {
  id: string;
  date: string;       // ISO string
  message: string;
  category?: string;
  recurring?: boolean;
  fired?: boolean;
}

const REMINDERS_FILE = path.join(ContextManager.dataDir, 'reminders.json');

export class ReminderService {
  private reminders: Reminder[] = [];
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  // Injected by main.ts after Electron is ready so we can show Notifications
  private notifyFn?: (title: string, body: string) => void;

  constructor() {
    this.load();
    this.scheduleAll();
  }

  setNotifyFn(fn: (title: string, body: string) => void): void {
    this.notifyFn = fn;
  }

  // ── persistence ────────────────────────────────────────────────────────────

  private load(): void {
    try {
      if (fs.existsSync(REMINDERS_FILE)) {
        this.reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8')) as Reminder[];
      }
    } catch {
      this.reminders = [];
    }
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(REMINDERS_FILE), { recursive: true });
      fs.writeFileSync(REMINDERS_FILE, JSON.stringify(this.reminders, null, 2), 'utf8');
    } catch (err) {
      console.error('JARVIS: Failed to save reminders:', err);
    }
  }

  // ── scheduling ─────────────────────────────────────────────────────────────

  private scheduleAll(): void {
    const now = Date.now();
    for (const r of this.reminders) {
      if (!r.fired) this.scheduleOne(r, now);
    }
  }

  private scheduleOne(reminder: Reminder, now = Date.now()): void {
    const delay = new Date(reminder.date).getTime() - now;
    if (delay <= 0) {
      // Already past — fire immediately if not yet fired
      if (!reminder.fired) this.fire(reminder);
      return;
    }
    const timer = setTimeout(() => this.fire(reminder), delay);
    this.timers.set(reminder.id, timer);
  }

  private fire(reminder: Reminder): void {
    console.log(`JARVIS REMINDER [${reminder.category ?? 'general'}]: ${reminder.message}`);

    if (this.notifyFn) {
      this.notifyFn(
        `JARVIS — ${reminder.category ?? 'Reminder'}`,
        reminder.message
      );
    }

    reminder.fired = true;
    this.timers.delete(reminder.id);

    if (reminder.recurring) {
      // Reschedule 24 h later
      const next: Reminder = {
        ...reminder,
        id: `${reminder.id}_${Date.now()}`,
        date: new Date(new Date(reminder.date).getTime() + 86_400_000).toISOString(),
        fired: false,
      };
      this.reminders.push(next);
      this.scheduleOne(next);
    }

    this.save();
  }

  // ── public API ─────────────────────────────────────────────────────────────

  async setReminder(
    date: Date,
    message: string,
    category?: string,
    recurring?: boolean
  ): Promise<boolean> {
    const reminder: Reminder = {
      id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: date.toISOString(),
      message,
      category,
      recurring: recurring ?? false,
      fired: false,
    };

    this.reminders.push(reminder);
    this.scheduleOne(reminder);
    this.save();

    console.log(`JARVIS: Reminder set for ${date.toLocaleString()} — "${message}"`);
    return true;
  }

  async getUpcomingReminders(limit = 10, startDate?: Date): Promise<Reminder[]> {
    const from = (startDate ?? new Date()).getTime();
    return this.reminders
      .filter(r => !r.fired && new Date(r.date).getTime() >= from)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, limit);
  }

  async cancelReminder(id: string): Promise<boolean> {
    const idx = this.reminders.findIndex(r => r.id === id);
    if (idx === -1) return false;

    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }

    this.reminders.splice(idx, 1);
    this.save();
    console.log(`JARVIS: Reminder ${id} cancelled.`);
    return true;
  }
}
