/**
 * RevoForms Embed Script
 * Usage: <script src="https://revoforms.dev/embed.js" data-form-id="YOUR_FORM_ID"></script>
 * 
 * Options (data attributes):
 * - data-form-id: Required. The form ID to embed
 * - data-mode: "inline" | "popup" | "slider" | "modal" (default: inline)
 * - data-trigger: For popup/slider - "button" | "time" | "scroll" | "exit" (default: button)
 * - data-delay: For time trigger - milliseconds (default: 3000)
 * - data-scroll: For scroll trigger - percentage (default: 50)
 * - data-button-text: Custom button text (default: "Open Form")
 * - data-button-style: "default" | "minimal" | "gradient" (default: gradient)
 * - data-position: For slider - "left" | "right" | "bottom" (default: right)
 * - data-width: Custom width (default: 100% for inline, 400px for popup)
 * - data-height: Custom height (default: auto)
 * - data-theme: "dark" | "light" | "auto" (default: dark)
 */

(function() {
  'use strict';

  const REVOFORMS_BASE_URL = window.REVOFORMS_BASE_URL || 'https://revoforms.dev';
  
  // Find the script tag
  const scripts = document.querySelectorAll('script[data-form-id]');
  
  scripts.forEach(function(script) {
    const formId = script.getAttribute('data-form-id');
    if (!formId) return;

    const options = {
      formId: formId,
      mode: script.getAttribute('data-mode') || 'inline',
      trigger: script.getAttribute('data-trigger') || 'button',
      delay: parseInt(script.getAttribute('data-delay') || '3000'),
      scroll: parseInt(script.getAttribute('data-scroll') || '50'),
      buttonText: script.getAttribute('data-button-text') || 'Open Form',
      buttonStyle: script.getAttribute('data-button-style') || 'gradient',
      position: script.getAttribute('data-position') || 'right',
      width: script.getAttribute('data-width') || (script.getAttribute('data-mode') === 'inline' ? '100%' : '420px'),
      height: script.getAttribute('data-height') || 'auto',
      theme: script.getAttribute('data-theme') || 'dark'
    };

    // Create container
    const container = document.createElement('div');
    container.id = 'revoforms-' + formId;
    container.className = 'revoforms-container revoforms-' + options.mode;
    script.parentNode.insertBefore(container, script.nextSibling);

    // Inject styles
    injectStyles(options);

    // Initialize based on mode
    switch (options.mode) {
      case 'inline':
        createInlineEmbed(container, options);
        break;
      case 'popup':
      case 'modal':
        createPopupEmbed(container, options);
        break;
      case 'slider':
        createSliderEmbed(container, options);
        break;
      default:
        createInlineEmbed(container, options);
    }
  });

  function injectStyles(options) {
    if (document.getElementById('revoforms-styles')) return;

    const isDark = options.theme === 'dark' || (options.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const styles = document.createElement('style');
    styles.id = 'revoforms-styles';
    styles.textContent = `
      .revoforms-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .revoforms-iframe {
        border: none;
        border-radius: 16px;
        width: 100%;
        min-height: 400px;
        background: ${isDark ? '#0a0a14' : '#ffffff'};
      }
      
      .revoforms-inline .revoforms-iframe {
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
      }
      
      /* Popup/Modal Styles */
      .revoforms-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        z-index: 99998;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      
      .revoforms-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      
      .revoforms-popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
        z-index: 99999;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        max-width: 90vw;
        max-height: 90vh;
        overflow: hidden;
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      }
      
      .revoforms-popup.active {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, -50%) scale(1);
      }
      
      .revoforms-popup .revoforms-iframe {
        border-radius: 20px;
      }
      
      .revoforms-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transition: all 0.2s;
        z-index: 10;
      }
      
      .revoforms-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
      
      /* Slider Styles */
      .revoforms-slider {
        position: fixed;
        top: 0;
        bottom: 0;
        width: 420px;
        max-width: 100vw;
        z-index: 99999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: -10px 0 40px rgba(0, 0, 0, 0.3);
      }
      
      .revoforms-slider.left {
        left: 0;
        right: auto;
        transform: translateX(-100%);
      }
      
      .revoforms-slider.right {
        right: 0;
        left: auto;
        transform: translateX(100%);
      }
      
      .revoforms-slider.bottom {
        top: auto;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 70vh;
        transform: translateY(100%);
      }
      
      .revoforms-slider.active {
        transform: translateX(0) translateY(0);
      }
      
      .revoforms-slider .revoforms-iframe {
        height: 100%;
        border-radius: 0;
      }
      
      /* Trigger Button Styles */
      .revoforms-trigger {
        cursor: pointer;
        border: none;
        font-size: 16px;
        font-weight: 600;
        padding: 14px 28px;
        border-radius: 12px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      
      .revoforms-trigger.gradient {
        background: linear-gradient(135deg, #06b6d4, #a855f7);
        color: white;
        box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
      }
      
      .revoforms-trigger.gradient:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
      }
      
      .revoforms-trigger.default {
        background: ${isDark ? '#1a1a2e' : '#f0f0f0'};
        color: ${isDark ? '#ffffff' : '#333333'};
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
      }
      
      .revoforms-trigger.minimal {
        background: transparent;
        color: #06b6d4;
        text-decoration: underline;
        padding: 8px 16px;
      }
      
      /* Floating Button for Slider */
      .revoforms-fab {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4, #a855f7);
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        z-index: 99997;
      }
      
      .revoforms-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(6, 182, 212, 0.5);
      }
      
      .revoforms-fab svg {
        width: 24px;
        height: 24px;
        fill: white;
      }
      
      .revoforms-fab.left {
        right: auto;
        left: 24px;
      }
    `;
    document.head.appendChild(styles);
  }

  function createInlineEmbed(container, options) {
    const iframe = document.createElement('iframe');
    iframe.className = 'revoforms-iframe';
    iframe.src = REVOFORMS_BASE_URL + '/f/' + options.formId + '?embed=true';
    iframe.style.width = options.width;
    iframe.style.height = options.height === 'auto' ? '500px' : options.height;
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'RevoForms Form');
    
    // Auto-resize iframe based on content
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'revoforms-resize' && e.data.formId === options.formId) {
        iframe.style.height = e.data.height + 'px';
      }
    });
    
    container.appendChild(iframe);
  }

  function createPopupEmbed(container, options) {
    // Create trigger button
    const trigger = document.createElement('button');
    trigger.className = 'revoforms-trigger ' + options.buttonStyle;
    trigger.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>' + options.buttonText;
    container.appendChild(trigger);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'revoforms-overlay';
    document.body.appendChild(overlay);

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'revoforms-popup';
    popup.style.width = options.width;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'revoforms-close';
    closeBtn.innerHTML = '×';
    popup.appendChild(closeBtn);

    const iframe = document.createElement('iframe');
    iframe.className = 'revoforms-iframe';
    iframe.style.width = options.width;
    iframe.style.height = options.height === 'auto' ? '600px' : options.height;
    popup.appendChild(iframe);
    document.body.appendChild(popup);

    function openPopup() {
      iframe.src = REVOFORMS_BASE_URL + '/f/' + options.formId + '?embed=true';
      overlay.classList.add('active');
      popup.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closePopup() {
      overlay.classList.remove('active');
      popup.classList.remove('active');
      document.body.style.overflow = '';
    }

    // Handle triggers
    if (options.trigger === 'button') {
      trigger.addEventListener('click', openPopup);
    } else if (options.trigger === 'time') {
      trigger.style.display = 'none';
      setTimeout(openPopup, options.delay);
    } else if (options.trigger === 'scroll') {
      trigger.style.display = 'none';
      let triggered = false;
      window.addEventListener('scroll', function() {
        if (triggered) return;
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= options.scroll) {
          triggered = true;
          openPopup();
        }
      });
    } else if (options.trigger === 'exit') {
      trigger.style.display = 'none';
      let triggered = false;
      document.addEventListener('mouseout', function(e) {
        if (triggered) return;
        if (e.clientY < 0) {
          triggered = true;
          openPopup();
        }
      });
    }

    closeBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', closePopup);
    
    // Close on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closePopup();
    });
  }

  function createSliderEmbed(container, options) {
    // Create FAB trigger
    const fab = document.createElement('button');
    fab.className = 'revoforms-fab ' + options.position;
    fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';
    document.body.appendChild(fab);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'revoforms-overlay';
    document.body.appendChild(overlay);

    // Create slider
    const slider = document.createElement('div');
    slider.className = 'revoforms-slider ' + options.position;
    slider.style.width = options.position === 'bottom' ? '100%' : options.width;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'revoforms-close';
    closeBtn.innerHTML = '×';
    slider.appendChild(closeBtn);

    const iframe = document.createElement('iframe');
    iframe.className = 'revoforms-iframe';
    slider.appendChild(iframe);
    document.body.appendChild(slider);

    function openSlider() {
      iframe.src = REVOFORMS_BASE_URL + '/f/' + options.formId + '?embed=true';
      overlay.classList.add('active');
      slider.classList.add('active');
      fab.style.display = 'none';
    }

    function closeSlider() {
      overlay.classList.remove('active');
      slider.classList.remove('active');
      fab.style.display = 'flex';
    }

    fab.addEventListener('click', openSlider);
    closeBtn.addEventListener('click', closeSlider);
    overlay.addEventListener('click', closeSlider);
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeSlider();
    });
  }

  // Expose API for programmatic control
  window.RevoForms = {
    open: function(formId) {
      const popup = document.querySelector('#revoforms-' + formId + ' + .revoforms-overlay');
      if (popup) popup.classList.add('active');
    },
    close: function(formId) {
      const popup = document.querySelector('#revoforms-' + formId + ' + .revoforms-overlay');
      if (popup) popup.classList.remove('active');
    }
  };
})();
