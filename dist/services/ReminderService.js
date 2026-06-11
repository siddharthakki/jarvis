"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ContextManager_1 = require("../agent/ContextManager");
const REMINDERS_FILE = path.join(ContextManager_1.ContextManager.dataDir, 'reminders.json');
class ReminderService {
    constructor() {
        this.reminders = [];
        this.timers = new Map();
        this.load();
        this.scheduleAll();
    }
    setNotifyFn(fn) {
        this.notifyFn = fn;
    }
    // ── persistence ────────────────────────────────────────────────────────────
    load() {
        try {
            if (fs.existsSync(REMINDERS_FILE)) {
                this.reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
            }
        }
        catch {
            this.reminders = [];
        }
    }
    save() {
        try {
            fs.mkdirSync(path.dirname(REMINDERS_FILE), { recursive: true });
            fs.writeFileSync(REMINDERS_FILE, JSON.stringify(this.reminders, null, 2), 'utf8');
        }
        catch (err) {
            console.error('JARVIS: Failed to save reminders:', err);
        }
    }
    // ── scheduling ─────────────────────────────────────────────────────────────
    scheduleAll() {
        const now = Date.now();
        for (const r of this.reminders) {
            if (!r.fired)
                this.scheduleOne(r, now);
        }
    }
    scheduleOne(reminder, now = Date.now()) {
        const delay = new Date(reminder.date).getTime() - now;
        if (delay <= 0) {
            // Already past — fire immediately if not yet fired
            if (!reminder.fired)
                this.fire(reminder);
            return;
        }
        const timer = setTimeout(() => this.fire(reminder), delay);
        this.timers.set(reminder.id, timer);
    }
    fire(reminder) {
        console.log(`JARVIS REMINDER [${reminder.category ?? 'general'}]: ${reminder.message}`);
        if (this.notifyFn) {
            this.notifyFn(`JARVIS — ${reminder.category ?? 'Reminder'}`, reminder.message);
        }
        reminder.fired = true;
        this.timers.delete(reminder.id);
        if (reminder.recurring) {
            // Reschedule 24 h later
            const next = {
                ...reminder,
                id: `${reminder.id}_${Date.now()}`,
                date: new Date(new Date(reminder.date).getTime() + 86400000).toISOString(),
                fired: false,
            };
            this.reminders.push(next);
            this.scheduleOne(next);
        }
        this.save();
    }
    // ── public API ─────────────────────────────────────────────────────────────
    async setReminder(date, message, category, recurring) {
        const reminder = {
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
    async getUpcomingReminders(limit = 10, startDate) {
        const from = (startDate ?? new Date()).getTime();
        return this.reminders
            .filter(r => !r.fired && new Date(r.date).getTime() >= from)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, limit);
    }
    async cancelReminder(id) {
        const idx = this.reminders.findIndex(r => r.id === id);
        if (idx === -1)
            return false;
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }
        this.reminders.splice(idx, 1);
        this.save();
        console.log(`JARVIS: Reminder ${id} cancelled.`);
        return true;
    }
}
exports.ReminderService = ReminderService;
