# Kế hoạch chi tiết: E2B Orchestration & High-Scale Stress Testing

## 1. Mục tiêu (Objectives)
- Mô phỏng 1,000+ người dùng hoạt động đồng thời (Events Per Second - EPS).
- Kiểm chứng vòng lặp "Hooked" (Trigger -> Action -> Variable Reward -> Investment).
- Đánh giá khả năng chịu tải của NestJS Event-Driven và PostgreSQL JSONB.
- Kiểm tra giới hạn của Gemini 1.5 Pro trong việc xử lý hàng ngàn Nudge context cùng lúc.

## 2. Thiết lập môi trường E2B (Sandbox Environment)
- **Runtime**: Sử dụng E2B Python/Node.js SDK để tạo Sandbox cô lập.
- **Components**:
    - **API Sandbox**: Clone source code NestJS, cài đặt dependencies, chạy API.
    - **Database Sandbox**: Dockerized PostgreSQL với schema đồng bộ từ Prisma.
    - **Load Generator**: Kịch bản k6 hoặc custom scripts để đẩy tải.

## 3. Quy trình thực hiện (Implementation Roadmap)

### Giai đoạn 1: Chuẩn bị (Preparation)
1. **Clone & Setup**: Đưa toàn bộ mã nguồn vào E2B Sandbox.
2. **Environment**: Cấu hình `E2B_API_KEY` và các biến môi trường AI.
3. **Data Seeding**: Tạo 10,000+ bản ghi người dùng giả lập với các Persona khác nhau (Hunter, Saver, etc.)

### Giai đoạn 2: Thực thi Tải (Stress Execution)
1. **Trigger Phase**: Đẩy 1,000 `points.earned` events/giây qua WebSocket/API.
2. **AI Processing**: Theo dõi `NudgeListener` gọi Gemini API và đo latency.
3. **Persistence Phase**: Kiểm tra tốc độ ghi vào `BehaviorLog` (JSONB) và `User` points.

### Giai đoạn 3: Phân tích & Báo cáo (Analysis)
1. **Metrics**: Thu thập EPS, Response Time (P99), Error Rate.
2. **Integrity Check**: Dùng `ValidationService` để kiểm tra dữ liệu JSONB sau khi stress test.

## 4. Kế hoạch Handoff (Handoff Plan)
Sau khi hoàn thiện kế hoạch này, tôi sẽ cung cấp một tài liệu **HANDOFF_CONTEXT.md** chứa:
- Trạng thái hiện tại của hệ thống Event-Driven.
- Cấu hình E2B Sandbox chi tiết.
- Các lệnh vận hành Stress Test.
- API Keys cần thiết (đã được che giấu an toàn).

---

## 5. Các bước tiếp theo (Next Steps)
1. Tôi sẽ tạo script `scripts/e2b-stress-orchestrator.js`.
2. Khởi tạo môi trường Docker trong E2B.
3. Thực hiện Handoff để mở rộng Context Window.
