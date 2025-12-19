# HANDOFF CONTEXT - V-EdFinance Stress Testing Phase

## 📌 Bối cảnh hiện tại (Current Status)
- Đã hoàn thành decoupling hoàn toàn hệ thống Behavioral Engine (Gamification, Nudge, Social, Store, Analytics) sang mô hình **Event-Driven (@nestjs/event-emitter)**.
- Mọi module giao tiếp qua events (`points.earned`, `points.deduct`, `nudge.request`).
- Stack: NestJS, Prisma, PostgreSQL (JSONB), Gemini 1.5 Pro.

## 🔑 Thông tin bảo mật (Secret Management)
- **E2B API Key**: `e2b_ec524b95bd0d195e79d49811f364c5f2d083d7df`
- **Google Gemini API**: Đã cấu hình trong `.env` (cần verify trong Sandbox).

## 🛠️ Mục tiêu phiên làm việc tiếp theo (Next Session Goals)
1. **Khởi tạo E2B Sandbox**: Chạy script `scripts/e2b-e2e-orchestrator.js` để spin up môi trường test.
2. **Stress Test 1,000+ EPS**: Sử dụng k6 hoặc bộ simulator có sẵn để kiểm tra `NudgeListener`.
3. **Verify Hooked Loop**: Đảm bảo chuỗi (User Action -> Points -> AI Nudge -> User Investment) hoạt động mượt mà dưới áp lực cao.
4. **JSONB Integrity**: Chạy diagnostics để xác nhận không có schema drift trong `BehaviorLog`.

## 📂 File quan trọng cần chú ý
- [E2B_ORCHESTRATION_PLAN.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/E2B_ORCHESTRATION_PLAN.md)
- [DEBUG_SPEC.md](file:///c:/Users/luaho/Demo%20project/v-edfinance/DEBUG_SPEC.md)
- [apps/api/src/modules/nudge/nudge.listener.ts](file:///c:/Users/luaho/Demo%20project/v-edfinance/apps/api/src/modules/nudge/nudge.listener.ts)

## 🚀 Hướng dẫn tiếp tục
Vui lòng sử dụng E2B CLI hoặc SDK để kết nối vào sandbox. Clone code từ repository hiện tại và thực hiện các bước trong Roadmap.
