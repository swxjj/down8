import React from 'react';
import { 
  AlertTriangle, 
  Lock, 
  ShieldAlert, 
  Clock, 
  WifiOff, 
  X, 
  RefreshCw, 
  ShieldCheck
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function ErrorAlert({ error, onDismiss, onRetry }) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An unexpected error occurred.';
  const lowerMsg = errorMessage.toLowerCase();

  // Categorize error for customized friendly guidance
  const isPrivatePost = lowerMsg.includes('private') || lowerMsg.includes('login') || lowerMsg.includes('auth') || lowerMsg.includes('restricted') || error.status === 403 || error.status === 401;
  const isSsrfBlock = lowerMsg.includes('ssrf') || lowerMsg.includes('security') || lowerMsg.includes('blocked host') || lowerMsg.includes('internal network') || lowerMsg.includes('127.0.0.1');
  const isRateLimit = lowerMsg.includes('rate limit') || lowerMsg.includes('429') || lowerMsg.includes('too many requests');
  const isNetworkFailure = error.isNetworkError || lowerMsg.includes('unable to connect') || lowerMsg.includes('network error') || lowerMsg.includes('econnrefused');

  const getErrorDetails = () => {
    if (isPrivatePost) {
      return {
        icon: Lock,
        title: 'Authentication Required / Restricted Post',
        cardStyle: 'bg-[#1c1914] border-[#3d2e1a] text-[#fcd34d]',
        iconBg: 'bg-[#2b2010] text-[#f59e0b]',
        badge: 'ACCESS RESTRICTED',
        guidance: 'down8 supports public streams only. This post is private, account-restricted, or requires active platform session authentication.',
        solution: 'Ensure the link opens in a private or incognito window without requiring an account login.',
      };
    }
    if (isSsrfBlock) {
      return {
        icon: ShieldAlert,
        title: 'Security Gateway Block',
        cardStyle: 'bg-[#1c1214] border-[#5c1d24] text-[#f87171]',
        iconBg: 'bg-[#2c161a] text-[#ef4444]',
        badge: 'SSRF PROTECTED',
        guidance: 'Extraction blocked by the internal network isolation filter. Loopback and internal IP ranges are permanently denied.',
        solution: 'Submit a canonical public media URL from YouTube, Instagram, X, or Facebook.',
      };
    }
    if (isRateLimit) {
      return {
        icon: Clock,
        title: 'Platform Rate Limit Exceeded',
        cardStyle: 'bg-[#1c1914] border-[#3d2e1a] text-[#fcd34d]',
        iconBg: 'bg-[#2b2010] text-[#f59e0b]',
        badge: 'HTTP 429 THROTTLE',
        guidance: 'The host platform has temporarily throttled upstream extraction requests from this IP.',
        solution: 'Wait 30-60 seconds before initiating another stream request.',
      };
    }
    if (isNetworkFailure) {
      return {
        icon: WifiOff,
        title: 'Backend Ingest Gateway Offline',
        cardStyle: 'bg-[#16161a] border-[#27272e] text-[#ededed]',
        iconBg: 'bg-[#202026] text-[#ededed]',
        badge: 'CONNECTION REFUSED',
        guidance: `Unable to reach the FastAPI core backend at ${API_BASE_URL}.`,
        solution: 'If deployed on Vercel, set VITE_API_BASE_URL in Vercel project settings to your public backend URL. For local dev, run python run.py.',
      };
    }
    return {
      icon: AlertTriangle,
      title: 'Media Extraction Failure',
      cardStyle: 'bg-[#1c1214] border-[#5c1d24] text-[#f87171]',
      iconBg: 'bg-[#2c161a] text-[#ef4444]',
      badge: 'INGEST ERROR',
      guidance: errorMessage,
      solution: 'Confirm the source URL contains active, accessible video or audio stream endpoints.',
    };
  };

  const details = getErrorDetails();
  const Icon = details.icon;

  return (
    <div 
      role="alert"
      className="w-full max-w-[760px] mx-auto animate-in fade-in duration-150 font-sans"
    >
      <div className={`rounded-[14px] border p-4 shadow-sm ${details.cardStyle}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 min-w-0">
            <div className={`p-2 rounded-[8px] flex-shrink-0 mt-0.5 ${details.iconBg}`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h4 className="text-[14px] font-medium tracking-tight">
                  {details.title}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/30 border border-current/40 opacity-90">
                  {details.badge}
                </span>
              </div>

              <p className="text-[13px] leading-relaxed max-w-2xl opacity-90">
                {details.guidance}
              </p>

              {details.solution && (
                <div className="mt-2 text-[12px] bg-[#16161a] text-[#ededed] rounded-[8px] p-2.5 border border-[#27272e] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-[#ededed]" />
                  <span><strong className="text-white">Action:</strong> {details.solution}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="p-1.5 rounded-[6px] text-current/70 hover:text-current hover:bg-white/10 transition-colors"
                title="Retry request"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-[6px] text-current/70 hover:text-current hover:bg-white/10 transition-colors"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
