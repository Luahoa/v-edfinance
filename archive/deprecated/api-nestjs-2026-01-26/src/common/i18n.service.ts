import { Injectable } from '@nestjs/common';

@Injectable()
export class I18nService {
  private readonly translations = {
    vi: {
      error: {
        unauthorized: 'Bạn không có quyền truy cập.',
        not_found: 'Không tìm thấy tài nguyên.',
        insufficient_points: 'Số điểm không đủ.',
      },
      success: {
        points_earned: 'Bạn đã nhận được {points} điểm!',
        task_completed: 'Nhiệm vụ hoàn thành.',
      },
      nudge: {
        social_proof: '{count} người dùng khác cũng đã chọn phương án này.',
        loss_aversion: 'Đừng để mất chuỗi {days} ngày của bạn!',
        framing_gain: 'Bạn sẽ tiết kiệm được {amount} nếu thực hiện ngay.',
      },
    },
    en: {
      error: {
        unauthorized: 'Unauthorized access.',
        not_found: 'Resource not found.',
        insufficient_points: 'Insufficient points.',
      },
      success: {
        points_earned: 'You earned {points} points!',
        task_completed: 'Task completed.',
      },
      nudge: {
        social_proof: '{count} other users also chose this option.',
        loss_aversion: "Don't lose your {days}-day streak!",
        framing_gain: 'You will save {amount} if you act now.',
      },
    },
    zh: {
      error: {
        unauthorized: '未授权访问。',
        not_found: '未找到资源。',
        insufficient_points: '积分不足。',
      },
      success: {
        points_earned: '您赚取了 {points} 积分！',
        task_completed: '任务完成。',
      },
      nudge: {
        social_proof: '{count} 位其他用户也选择了此选项。',
        loss_aversion: '不要失去您的 {days} 天连胜！',
        framing_gain: '如果您现在行动，您将节省 {amount}。',
      },
    },
  };

  translate(
    key: string,
    locale = 'vi',
    params: Record<string, any> = {},
  ): string {
    const keys = key.split('.');
    const translations = this.translations as Record<string, any>;
    let result = translations[locale] || translations.vi;

    for (const k of keys) {
      result = result?.[k];
    }

    if (typeof result !== 'string') return key;

    // Simple param replacement
    return Object.entries(params).reduce(
      (acc, [pKey, pVal]) => acc.replace(`{${pKey}}`, String(pVal)),
      result,
    );
  }

  /**
   * Alias for translate() to satisfy different service naming conventions
   */
  t(key: string, locale = 'vi', params: Record<string, any> = {}): string {
    return this.translate(key, locale, params);
  }

  getLocalizedField(field: any, locale = 'vi'): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[locale] || field.vi || field.en || '';
  }
}
