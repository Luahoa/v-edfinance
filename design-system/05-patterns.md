# 05. Behavioral Finance UI Patterns

**Goal:** Drive financial health through Nudge Theory (Thaler) and Hooked Model (Eyal).

## 🧠 Nudge Patterns

### 1. Social Proof Widget
**Concept:** "People like you are doing this."
**Usage:** Dashboard, Course Landing Pages.

```tsx
<div className="flex items-center gap-2 bg-blue-50 text-blue-900 px-3 py-1 rounded-full text-sm">
  <UsersIcon className="w-4 h-4" />
  <span>
    <span className="font-bold">1,240 students</span> learned budgeting today
  </span>
</div>
```

### 2. Loss Aversion Alert
**Concept:** "Pain of losing is 2x pleasure of gaining."
**Usage:** Streak maintenance, Expiring offers.

```tsx
<div className="border-l-4 border-red-600 bg-red-50 p-4 rounded-r">
  <div className="flex items-start">
    <FireIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
    <div>
      <h4 className="font-bold text-red-900">Danger: 7-Day Streak at Risk!</h4>
      <p className="text-red-700 text-sm">Complete 1 lesson in <span className="font-mono font-bold">04:23:10</span> to keep your streak.</p>
    </div>
  </div>
</div>
```

### 3. Default Bias (Opt-Out)
**Concept:** "Path of least resistance."
**Usage:** Savings settings, notification permissions.

- **Bad:** Checkbox unchecked by default.
- **Good:** Checkbox checked, "Recommended" tag added.

```tsx
<label className="flex items-center p-4 border-2 border-green-500 bg-green-50 rounded-lg cursor-pointer">
  <Checkbox checked className="text-green-600" />
  <div className="ml-3">
    <span className="block font-medium">Auto-save 10% of rewards</span>
    <span className="text-xs text-green-700 bg-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide font-bold">Recommended</span>
  </div>
</label>
```

---

## 🎣 Hooked Model Patterns

### 1. Trigger (External)
**Concept:** "Call to action."
**Usage:** Push notifications, red badges.

- **Floating Action Button (FAB):** Sticky "Resume Learning" button on mobile.
- **Badges:** Red dot on "Quests" tab when rewards available.

### 2. Action (Simplification)
**Concept:** "Ease of use."
**Usage:** One-click enrollment, Swipe to complete.

- **Big Green Button:** Primary action must be >48px height.
- **Input Steppers:** Avoid typing numbers; use +/- for amounts.

### 3. Variable Reward
**Concept:** "Unpredictable outcome."
**Usage:** Quiz completion, Daily login.

- **Mystery Chest:** Gold/Silver/Bronze chests with random point values.
- **Confetti:** Explodes on screen when 100% score achieved.

### 4. Investment
**Concept:** "I put work in, so I value it."
**Usage:** Profile completion, Custom savings goals.

- **Sunk Cost Progress:** "You've already completed 40%. Don't stop now!"
- **Customization:** "Your personal finance plan" (User named it).

---

## 🌾 Cultural Metaphors (Vietnam)

| Concept | Metaphor | Visual Element |
|---------|----------|----------------|
| **Savings** | "Tích tiểu thành đại" (Small accumulates to big) | Rice jar filling up |
| **Streak** | "Nuôi heo đất" (Raising clay pig) | Piggy bank growing |
| **Growth** | "Mùa gặt" (Harvest season) | Golden rice fields |
| **Debt** | "Cỏ dại" (Weeds) | Weeds choking plants |

### Implementation Note
Use `lucide-react` icons combined with custom SVGs for these metaphors.
