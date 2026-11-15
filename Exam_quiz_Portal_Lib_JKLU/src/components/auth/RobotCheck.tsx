import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { RefreshCw, ShieldCheck, CheckSquare, Square } from 'lucide-react';

export interface CaptchaChallengeData {
  id: string;
  answer: string;
  expiresAt: number;
  signature: string;
}

export interface CaptchaPayload {
  captcha_token?: string;
  captcha_challenge?: CaptchaChallengeData;
}

interface RobotCheckProps {
  onChange: (payload: CaptchaPayload | null) => void;
  resetKey?: number;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
).replace(/\/+$/, '');
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      render: (container: HTMLElement, options: Record<string, any>) => number;
      reset: (widgetId?: number) => void;
    };
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, any>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const RobotCheck: React.FC<RobotCheckProps> = ({ onChange, resetKey = 0 }) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<{
    id: string;
    question: string;
    expiresAt: number;
    signature: string;
  } | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const recaptchaIdRef = useRef<number | null>(null);
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;

    const renderRecaptcha = () => {
      if (!recaptchaRef.current || !window.grecaptcha) return;
      window.grecaptcha.ready(() => {
        if (!recaptchaRef.current || !window.grecaptcha || recaptchaIdRef.current !== null) return;
        recaptchaIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => onChange({ captcha_token: token }),
          'expired-callback': () => onChange(null),
          'error-callback': () => onChange(null),
        });
      });
    };

    if (window.grecaptcha) {
      renderRecaptcha();
    } else {
      const existingScript = document.querySelector('script[data-recaptcha="true"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.recaptcha = 'true';
        script.onload = renderRecaptcha;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderRecaptcha);
      }
    }
  }, [onChange]);

  useEffect(() => {
    if (RECAPTCHA_SITE_KEY || !TURNSTILE_SITE_KEY) return;

    const renderWidget = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => onChange({ captcha_token: token }),
        'expired-callback': () => onChange(null),
        'error-callback': () => onChange(null),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector('script[data-turnstile="true"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = 'true';
        script.onload = renderWidget;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderWidget);
      }
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, [onChange]);

  const fetchChallenge = async () => {
    setLoading(true);
    setError('');
    setAnswer('');
    onChange(null);
    const loadOnce = () =>
      axios.get(`${API_BASE_URL}/captcha/challenge`, { timeout: 25000 });
    try {
      let res;
      try {
        res = await loadOnce();
      } catch {
        await new Promise((r) => setTimeout(r, 1200));
        res = await loadOnce();
      }
      if (res.data?.mode === 'builtin') {
        setChallenge({
          id: res.data.id,
          question: res.data.question,
          expiresAt: res.data.expiresAt,
          signature: res.data.signature,
        });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      setError(
        status === 404
          ? 'Backend not updated yet (404). Please push & redeploy backend.'
          : 'Could not load verification challenge. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resetKey === 0) return;
    if (RECAPTCHA_SITE_KEY && recaptchaIdRef.current !== null && window.grecaptcha) {
      window.grecaptcha.reset(recaptchaIdRef.current);
      onChange(null);
      return;
    }
    if (TURNSTILE_SITE_KEY && widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onChange(null);
      return;
    }
    if (checked) {
      fetchChallenge();
    } else {
      setAnswer('');
      setChallenge(null);
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (RECAPTCHA_SITE_KEY) {
    return (
      <div className="py-1">
        <div ref={recaptchaRef} />
      </div>
    );
  }

  if (TURNSTILE_SITE_KEY) {
    return (
      <div className="py-1">
        <div ref={turnstileRef} />
      </div>
    );
  }

  const handleToggle = () => {
    if (checked) {
      setChecked(false);
      setChallenge(null);
      setAnswer('');
      onChange(null);
    } else {
      setChecked(true);
      fetchChallenge();
    }
  };

  const handleAnswerChange = (val: string) => {
    setAnswer(val);
    const trimmed = val.trim();
    if (challenge && trimmed !== '') {
      onChange({
        captcha_challenge: {
          id: challenge.id,
          answer: trimmed,
          expiresAt: challenge.expiresAt,
          signature: challenge.signature,
        },
      });
    } else {
      onChange(null);
    }
  };

  return (
    <div className="rounded-md border border-[#E5E2DC] dark:border-[#232329] bg-[#FAF9F6] dark:bg-[#111114] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2.5 text-sm font-medium text-[#0A0A0C] dark:text-[#F5F4F0] focus:outline-none"
        >
          {checked ? (
            <CheckSquare className="w-5 h-5 text-[#4F46E5] dark:text-[#818CF8] shrink-0" />
          ) : (
            <Square className="w-5 h-5 text-[#5C5B57] dark:text-[#94938E] shrink-0" />
          )}
          <span>I am not a robot</span>
        </button>
        <div className="flex items-center gap-1 text-[10px] font-mono-tabular uppercase tracking-wider text-[#5C5B57] dark:text-[#94938E]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#E04F33]" />
          <span>Human Check</span>
        </div>
      </div>

      {checked && (
        <div className="pt-2 border-t border-[#E5E2DC] dark:border-[#232329]">
          {loading ? (
            <p className="text-xs text-[#5C5B57] dark:text-[#94938E]">Loading challenge...</p>
          ) : error ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#E04F33]">{error}</p>
              <button
                type="button"
                onClick={fetchChallenge}
                className="text-xs text-[#4F46E5] dark:text-[#818CF8] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : challenge ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-tabular px-2.5 py-1.5 rounded bg-white dark:bg-[#1A1A1F] border border-[#E5E2DC] dark:border-[#232329] text-[#0A0A0C] dark:text-[#F5F4F0] shrink-0">
                {challenge.question}
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Answer"
                aria-label="Robot check answer"
                className="input-field py-1.5 px-2.5 text-xs w-24"
              />
              <button
                type="button"
                onClick={fetchChallenge}
                title="New challenge"
                className="p-1.5 rounded text-[#5C5B57] dark:text-[#94938E] hover:text-[#0A0A0C] dark:hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default RobotCheck;
