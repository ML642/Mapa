import { SOCIAL_SHARE_CONFIG } from '../config/env';

export interface ShareOptions {
  link: string;
  text: string;
}

/**
 * Social Share Service
 * Handles sharing links to various social platforms
 */
export const socialShareService = {
  /**
   * Share to Telegram
   */
  shareToTelegram: (options: ShareOptions) => {
    const url = `${SOCIAL_SHARE_CONFIG.TELEGRAM}?url=${encodeURIComponent(options.link)}&text=${encodeURIComponent(options.text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  },

  /**
   * Share to WhatsApp
   */
  shareToWhatsApp: (options: ShareOptions) => {
    const url = `${SOCIAL_SHARE_CONFIG.WHATSAPP}?text=${encodeURIComponent(options.text + ' ' + options.link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  },

  /**
   * Share to Viber
   */
  shareToViber: (options: ShareOptions) => {
    const url = `${SOCIAL_SHARE_CONFIG.VIBER}?text=${encodeURIComponent(options.text + ' ' + options.link)}`;
    window.open(url, '_blank', 'width=600,height=400');
  },

  /**
   * Share to VK
   */
  shareToVK: (options: ShareOptions) => {
    const url = `${SOCIAL_SHARE_CONFIG.VK}?url=${encodeURIComponent(options.link)}&title=${encodeURIComponent(options.text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  },

  /**
   * Share to Instagram (copy link fallback)
   */
  shareToInstagram: async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  },

  /**
   * Copy link to clipboard
   */
  copyToClipboard: async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  },
};

