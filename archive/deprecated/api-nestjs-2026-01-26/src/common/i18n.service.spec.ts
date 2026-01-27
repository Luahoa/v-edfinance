import { beforeEach, describe, expect, it } from 'vitest';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService();
  });

  describe('translate', () => {
    it('should return Vietnamese translation by default', () => {
      const result = service.translate('error.not_found');
      expect(result).toBe('Không tìm thấy tài nguyên.');
    });

    it('should return English translation', () => {
      const result = service.translate('error.not_found', 'en');
      expect(result).toBe('Resource not found.');
    });

    it('should return Chinese translation', () => {
      const result = service.translate('error.not_found', 'zh');
      expect(result).toBe('未找到资源。');
    });

    it('should replace parameters correctly', () => {
      const result = service.translate('success.points_earned', 'vi', {
        points: 100,
      });
      expect(result).toBe('Bạn đã nhận được 100 điểm!');
    });

    it('should return the key if translation is not found', () => {
      const result = service.translate('non.existent.key');
      expect(result).toBe('non.existent.key');
    });

    it('should replace multiple parameters in all locales', () => {
      const viResult = service.translate('nudge.social_proof', 'vi', {
        count: 42,
      });
      const enResult = service.translate('nudge.social_proof', 'en', {
        count: 42,
      });
      const zhResult = service.translate('nudge.social_proof', 'zh', {
        count: 42,
      });

      expect(viResult).toBe('42 người dùng khác cũng đã chọn phương án này.');
      expect(enResult).toBe('42 other users also chose this option.');
      expect(zhResult).toBe('42 位其他用户也选择了此选项。');
    });

    it('should handle complex parameter replacement', () => {
      const result = service.translate('nudge.framing_gain', 'en', {
        amount: '$50',
      });
      expect(result).toBe('You will save $50 if you act now.');
    });

    it('should fallback to Vietnamese when locale not found', () => {
      const result = service.translate('error.unauthorized', 'invalid' as any);
      expect(result).toBe('Bạn không có quyền truy cập.');
    });

    it('should handle nested key lookups', () => {
      expect(service.translate('error.insufficient_points', 'vi')).toBe(
        'Số điểm không đủ.',
      );
      expect(service.translate('success.task_completed', 'en')).toBe(
        'Task completed.',
      );
      expect(service.translate('nudge.loss_aversion', 'zh', { days: 7 })).toBe(
        '不要失去您的 7 天连胜！',
      );
    });

    it('should return key if intermediate path is invalid', () => {
      const result = service.translate('error.deep.nested.invalid');
      expect(result).toBe('error.deep.nested.invalid');
    });

    it('should handle empty parameters object', () => {
      const result = service.translate('success.task_completed', 'vi', {});
      expect(result).toBe('Nhiệm vụ hoàn thành.');
    });

    it('should convert non-string parameter values to strings', () => {
      const result = service.translate('success.points_earned', 'en', {
        points: 9999,
      });
      expect(result).toBe('You earned 9999 points!');
    });
  });

  describe('getLocalizedField', () => {
    it('should return field for specific locale', () => {
      const field = { vi: 'Chào', en: 'Hello' };
      expect(service.getLocalizedField(field, 'en')).toBe('Hello');
    });

    it('should fallback to vi if locale not found', () => {
      const field = { vi: 'Chào' };
      expect(service.getLocalizedField(field, 'zh')).toBe('Chào');
    });

    it('should return empty string if field is null', () => {
      expect(service.getLocalizedField(null)).toBe('');
    });

    it('should extract Vietnamese field from JSONB', () => {
      const field = {
        vi: 'Học tài chính',
        en: 'Learn Finance',
        zh: '学习金融',
      };
      expect(service.getLocalizedField(field, 'vi')).toBe('Học tài chính');
    });

    it('should extract Chinese field from JSONB', () => {
      const field = {
        vi: 'Học tài chính',
        en: 'Learn Finance',
        zh: '学习金融',
      };
      expect(service.getLocalizedField(field, 'zh')).toBe('学习金融');
    });

    it('should fallback to en if vi is missing', () => {
      const field = { en: 'English text', zh: '中文' };
      expect(service.getLocalizedField(field, 'fr')).toBe('English text');
    });

    it('should handle plain string as-is', () => {
      const field = 'Plain text';
      expect(service.getLocalizedField(field, 'vi')).toBe('Plain text');
    });

    it('should return empty string if field is undefined', () => {
      expect(service.getLocalizedField(undefined)).toBe('');
    });

    it('should return empty string if field is empty object', () => {
      expect(service.getLocalizedField({})).toBe('');
    });

    it('should prioritize requested locale over fallbacks', () => {
      const field = { vi: 'VN', en: 'EN', zh: 'ZH' };
      expect(service.getLocalizedField(field, 'zh')).toBe('ZH');
      expect(service.getLocalizedField(field, 'en')).toBe('EN');
      expect(service.getLocalizedField(field, 'vi')).toBe('VN');
    });
  });
});
