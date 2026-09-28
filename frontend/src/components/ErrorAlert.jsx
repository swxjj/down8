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
        title: 'Private or Account-Gated Content',
        accentColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        badge: 'Authentication Required',
        guidance: 'OmniMedia supports public posts only to protect user privacy. This video, story, or carousel is set to private, friends-only, or requires an active platform login.',
        solution: 'Verify that the post is accessible in an incognito browser tab without logging into any account.',
      };
    }
    if (isSsrfBlock) {
      return {
        icon: ShieldAlert,
        title: 'Security Policy: URL Blocked',
        accentColor: 'border-red-500/30 bg-red-500/10 text-red-300',
        badge: 'SSRF Protection Active',
        guidance: 'Our security gateway blocked this URL because it resolved to a private IP, loopback, or non-whitelisted domain.',
        solution: 'Provide a direct public link from YouTube, Instagram, X/Twitter, or Facebook.',
      };
    }
    if (isRateLimit) {
      return {
        icon: Clock,
        title: 'Platform Rate Limit Reached',
        accentColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        badge: 'HTTP 429 Throttle',
        guidance: 'The target platform is temporarily throttling incoming extraction requests.',
        solution: 'Wait 30-60 seconds and attempt the fetch again. High-speed caching is active.',
      };
    }
    if (isNetworkFailure) {
      return {
        icon: WifiOff,
        title: 'Backend Server Connection Failed',
        accentColor: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
        badge: 'Offline Service',
        guidance: 'Could not connect to the OmniMedia extraction backend (http://localhost:8000).',
        solution: 'Make sure your Python / FastAPI service is running. In the meantime, try our interactive demo samples above to explore the UI features.',
      };
    }
    return {
      icon: AlertTriangle,
      title: 'Extraction Error',
      accentColor: 'border-red-500/30 bg-red-500/10 text-red-300',
      badge: 'Parsing Failed',
      guidance: errorMessage,
      solution: 'Ensure the link is valid and contains downloadable video, photo, or audio media.',
    };
  };

  const details = getErrorDetails();
  const Icon = details.icon;

  return (
    <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-top-3 duration-300">
      <div className={`rounded-2xl border p-4 sm:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden ${details.accentColor}`}>
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-white/10 flex-shrink-0 mt-0.5 shadow-inner">
              <Icon className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {details.title}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-white/10 text-white border border-white/15">
                  {details.badge}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                {details.guidance}
              </p>

              {details.solution && (
                <div className="mt-2 text-[11px] text-slate-400 bg-black/20 rounded-lg p-2.5 border border-white/5 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span><strong>Suggestion:</strong> {details.solution}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Retry request"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
