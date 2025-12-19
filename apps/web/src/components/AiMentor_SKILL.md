# SKILL: Edtech AI Mentor (V-EdFinance Standard)

Bộ kỹ năng này định nghĩa cách triển khai một trợ lý AI thực thụ cho nền tảng giáo dục, tập trung vào khả năng đồng hành, quản lý ngữ cảnh và phương pháp sư phạm.

## 1. Kiến trúc luồng (Threading)
Thay vì một luồng chat vô tận, hệ thống phải tổ chức theo `Threads` để:
- Phân loại chủ đề học tập.
- Giảm nhiễu ngữ cảnh (Context Noise).
- Dễ dàng truy xuất lại kiến thức cũ.

**Triển khai:**
- Mỗi khi user bắt đầu một vấn đề mới (ví dụ: "Tìm hiểu về ROE"), hệ thống tạo 1 Thread.
- Lưu lịch sử chat vào DB (`ChatThread` & `ChatMessage`).

## 2. Quản lý Ngữ cảnh (Context Injection)
AI Mentor không được trả lời như một chatbot phổ thông. Nó phải được "tiêm" (Inject) các dữ liệu sau vào System Prompt:
- **User Profile:** Trình độ hiện tại, khẩu vị rủi ro, mục tiêu tài chính.
- **Learning Progress:** Các bài học đã hoàn thành gần đây.
- **Course Content:** Nội dung của module mà user đang đứng tại đó.

## 3. Phương pháp Sư phạm (Pedagogy)
AI phải linh hoạt chuyển đổi giữa các chế độ:
- **Coach Mode:** Định hướng hành động (Action-Oriented). Luôn kết thúc bằng một gợi ý bài học hoặc bài tập tiếp theo.
- **Socratic Mode:** Phản biện gợi mở. Khi user hỏi "Tại sao?", AI không trả lời ngay mà đưa ra các dữ liệu để user tự suy luận.

## 4. Giao diện người dùng (Handoff & Action Cards - Hooked Model)
Chatbot cần có khả năng "bàn giao" công việc cho hệ thống dựa trên mô hình Hooked:
- **Trigger:** AI chủ động nhận diện nhu cầu và gửi **Action Cards**.
- **Action:** Giảm ma sát bằng cách tích hợp nút bấm thực hiện ngay (Ví dụ: "Bắt đầu Quiz").
- **Variable Reward:** Tích hợp hệ thống điểm thưởng và huy hiệu bất ngờ khi hoàn thành hành động từ chat.
- **Investment:** Khuyến khích user cập nhật profile hoặc lưu lại insight để tạo giá trị lâu dài.

**Cấu trúc Metadata cho Action Card:**
```json
{
  "hasActionCard": true,
  "type": "COURSE_LINK" | "QUIZ" | "UPDATE_PROFILE",
  "label": "Tên nút bấm",
  "payload": { "id": "...", "url": "..." }
}
```

## 5. Đo lường & Tối ưu (Behavioral Analytics)
Hệ thống phải ghi nhận mọi tương tác để AI có thể tự tối ưu:
- **Events:** `SEND_CHAT_MESSAGE`, `CLICK_ACTION_CARD`, `VIEW_LESSON`.
- **Feedback Loop:** AI truy cập lịch sử hành vi gần nhất để điều chỉnh "Cú hích" (Nudge).

## 6. Lý thuyết Nudges (Richard Thaler)
Áp dụng vào Prompt để tăng tỷ lệ hoàn thành khóa học:
- **Social Proof:** "Đã có 500 người hoàn thành bài này hôm nay."
- **Loss Aversion:** "Bạn sắp đạt được chuỗi 5 ngày học tập, đừng bỏ lỡ!"
- **Defaulting:** Luôn đưa ra gợi ý hành động tiếp theo như một lựa chọn mặc định.
