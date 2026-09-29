import axios from 'axios';

// Base API URL configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Detect social media platform from a given URL
 * @param {string} url 
 * @returns {'youtube' | 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'generic'}
 */
export function detectPlatform(url) {
  if (!url || typeof url !== 'string') return 'generic';
  const cleanUrl = url.toLowerCase().trim();
  
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (cleanUrl.includes('instagram.com')) {
    return 'instagram';
  }
  if (cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com')) {
    return 'twitter';
  }
  if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch') || cleanUrl.includes('fb.com')) {
    return 'facebook';
  }
  if (cleanUrl.includes('tiktok.com')) {
    return 'tiktok';
  }
  return 'generic';
}

/**
 * Fetch media information and available formats
 * @param {string} url 
 * @returns {Promise<Object>}
 */
export async function fetchMediaInfo(url) {
  // Allow demo previews if user pastes demo test URLs
  if (url.includes('demo:instagram') || url.includes('instagram.com/p/demo-carousel')) {
    return getMockCarouselData();
  }
  if (url.includes('demo:youtube') || url.includes('youtube.com/watch?v=demo-4k')) {
    return getMockYoutubeData();
  }
  if (url.includes('demo:twitter') || url.includes('x.com/demo-status')) {
    return getMockTwitterData();
  }

  try {
    const response = await client.post('/api/info', { url });
    return response.data;
  } catch (error) {
    // If backend is not running (Network Error / Connection Refused) and user tests with generic sample
    if (error.code === 'ERR_NETWORK' || !error.response) {
      console.warn('Backend server not reachable at ' + API_BASE_URL + '. Providing informative error or fallback.');
      const err = new Error(
        'Unable to connect to backend server at ' + API_BASE_URL + '. Please ensure the down8 backend is running, or try our sample links.'
      );
      err.isNetworkError = true;
      throw err;
    }
    
    // Parse backend response error message
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;
    const status = error.response?.status;
    const customError = new Error(message);
    customError.status = status;
    customError.data = error.response?.data;
    throw customError;
  }
}

/**
 * Start a single media download task
 * @param {Object} params
 * @param {string} params.url
 * @param {string} [params.format_id]
 * @param {'video' | 'audio'} [params.media_type]
 * @param {'mp3' | 'm4a'} [params.audio_format]
 * @param {number} [params.item_index]
 * @returns {Promise<{ task_id: string, status: string }>}
 */
export async function startDownload({ url, format_id = '1080p', media_type = 'video', audio_format = 'mp3', item_index = null }) {
  if (url.includes('demo')) {
    return {
      task_id: 'mock-task-' + Date.now(),
      status: 'queued',
      isMock: true,
      options: { url, format_id, media_type, audio_format, item_index }
    };
  }

  try {
    const response = await client.post('/api/download', {
      url,
      format_id,
      media_type,
      audio_format,
      item_index,
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      // Fallback for standalone frontend test
      return {
        task_id: 'mock-task-' + Date.now(),
        status: 'queued',
        isMock: true,
        options: { url, format_id, media_type, audio_format, item_index }
      };
    }
    const message = error.response?.data?.detail || error.message;
    throw new Error(message);
  }
}

/**
 * Start a ZIP download for multi-item / carousel posts
 * @param {Object} params
 * @param {string} params.url
 * @param {Array<number|string>} [params.selected_ids]
 * @returns {Promise<{ task_id: string, status: string }>}
 */
export async function startZipDownload({ url, selected_ids = [] }) {
  if (url.includes('demo')) {
    return {
      task_id: 'mock-zip-' + Date.now(),
      status: 'queued',
      isMock: true,
      options: { url, selected_ids, isZip: true }
    };
  }

  try {
    const response = await client.post('/api/download-zip', {
      url,
      selected_ids,
    });
    return response.data;
  } catch (error) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return {
        task_id: 'mock-zip-' + Date.now(),
        status: 'queued',
        isMock: true,
        options: { url, selected_ids, isZip: true }
      };
    }
    const message = error.response?.data?.detail || error.message;
    throw new Error(message);
  }
}

/**
 * Subscribe to server-sent events for real-time download progress
 * @param {string} taskId 
 * @param {Function} onProgress 
 * @param {Function} onComplete 
 * @param {Function} onError 
 * @returns {() => void} unsubscribe cleanup function
 */
export function subscribeToTaskEvents(taskId, onProgress, onComplete, onError) {
  // If simulated/mock task, run mock SSE simulation
  if (taskId.startsWith('mock-')) {
    return simulateMockTaskEvents(taskId, onProgress, onComplete);
  }

  let isTerminated = false;
  let pollTimer = null;
  let eventSource = null;

  const handlePayload = (data) => {
    if (isTerminated || !data) return;

    const normalized = {
      ...data,
      progress: data.percent ?? data.progress ?? 0,
      percent: data.percent ?? data.progress ?? 0,
      speed: data.speed || 'Streaming...',
      eta: data.eta || 'Calculating...',
    };

    if (data.status === 'completed') {
      isTerminated = true;
      if (pollTimer) clearInterval(pollTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      onComplete(normalized);
    } else if (data.status === 'failed' || data.status === 'error') {
      isTerminated = true;
      if (pollTimer) clearInterval(pollTimer);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      onError(data.error || 'Download failed');
    } else {
      onProgress(normalized);
    }
  };

  const onIncomingEvent = (event) => {
    try {
      if (!event.data) return;
      const data = JSON.parse(event.data);
      handlePayload(data);
    } catch (err) {
      console.error('Failed to parse SSE event data', err);
    }
  };

  const eventSourceUrl = `${API_BASE_URL}/api/tasks/${taskId}/events`;
  try {
    eventSource = new EventSource(eventSourceUrl);
    eventSource.onmessage = onIncomingEvent;
    eventSource.addEventListener('message', onIncomingEvent);
    eventSource.addEventListener('progress', onIncomingEvent);
    eventSource.addEventListener('status', onIncomingEvent);

    eventSource.onerror = (err) => {
      // Don't terminate immediately, let backup polling take over seamlessly
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
        eventSource = null;
      }
    };
  } catch (e) {
    console.warn('EventSource initialization fallback to polling:', e);
  }

  // Backup polling every 600ms to guarantee speed/progress updates are never missed
  pollTimer = setInterval(async () => {
    if (isTerminated) {
      clearInterval(pollTimer);
      return;
    }
    try {
      const response = await client.get(`/api/tasks/${taskId}`);
      if (response && response.data) {
        handlePayload(response.data);
      }
    } catch (err) {
      // Ignore polling hiccups while task runs
    }
  }, 600);

  return () => {
    isTerminated = true;
    if (pollTimer) clearInterval(pollTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Get direct download file URL for a completed task
 * @param {string} taskId 
 * @returns {string}
 */
export function getDownloadUrl(taskId) {
  return `${API_BASE_URL}/api/tasks/${taskId}/file`;
}

/**
 * Get in-browser media preview streaming URL
 * @param {string} taskId 
 * @returns {string}
 */
export function getPreviewUrl(taskId) {
  return `${API_BASE_URL}/api/tasks/${taskId}/preview`;
}

/**
 * Programmatically trigger browser download dialog
 * @param {string} url 
 * @param {string} filename 
 */
export function triggerBrowserDownload(url, filename = 'downloaded-media') {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// Realistic Mock / Demo Data for Instant Interactive Testing
// -------------------------------------------------------------

function simulateMockTaskEvents(taskId, onProgress, onComplete) {
  const isZip = taskId.includes('zip');
  const steps = isZip
    ? [
        { progress: 10, status: 'connecting', status_text: 'Analyzing carousel items...', speed: '4.2 MB/s', eta: '00:08' },
        { progress: 35, status: 'downloading', status_text: 'Fetching item 1/4 and 2/4...', speed: '7.8 MB/s', eta: '00:05' },
        { progress: 65, status: 'downloading', status_text: 'Fetching item 3/4 and 4/4...', speed: '9.1 MB/s', eta: '00:03' },
        { progress: 88, status: 'packaging', status_text: 'Packaging items into high-compression ZIP...', speed: '12.0 MB/s', eta: '00:01' },
        { progress: 100, status: 'completed', status_text: 'Ready for download!', speed: '0 MB/s', eta: '00:00', filename: 'Instagram_Carousel_Archive.zip', file_size: '42.6 MB' }
      ]
    : [
        { progress: 12, status: 'connecting', status_text: 'Resolving adaptive stream manifests...', speed: '3.1 MB/s', eta: '00:10' },
        { progress: 42, status: 'downloading', status_text: 'Downloading high-bitrate video chunks...', speed: '8.4 MB/s', eta: '00:06' },
        { progress: 75, status: 'downloading', status_text: 'Downloading uncompressed audio stream...', speed: '10.2 MB/s', eta: '00:03' },
        { progress: 92, status: 'muxing', status_text: 'Muxing Video + Audio with FFmpeg lossless pass...', speed: '18.5 MB/s', eta: '00:01' },
        { progress: 100, status: 'completed', status_text: 'Processing complete!', speed: '0 MB/s', eta: '00:00', filename: 'down8_Video_1080p.mp4', file_size: '86.4 MB' }
      ];

  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep < steps.length) {
      const stepData = {
        task_id: taskId,
        ...steps[currentStep],
      };
      if (stepData.status === 'completed') {
        onComplete(stepData);
        clearInterval(interval);
      } else {
        onProgress(stepData);
      }
      currentStep++;
    } else {
      clearInterval(interval);
    }
  }, 1100);

  return () => clearInterval(interval);
}

export function getMockYoutubeData() {
  return {
    id: 'yt-demo-4k',
    url: 'https://youtube.com/watch?v=demo-4k',
    title: 'Cinematic 4K Nature Showcase — Dolomites Alpine Peak Exploration',
    uploader: 'Apex Cinematography',
    uploader_id: '@ApexCinema',
    platform: 'youtube',
    duration: 254,
    duration_formatted: '04:14',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    description: 'Captured in 4K 60fps HDR. Experience the pristine jagged peaks of Tre Cime di Lavaredo and crystal clear alpine lakes in the Italian Dolomites. Mastered in wide color gamut with multi-track Dolby atmos stereo audio.',
    view_count: '1,420,800',
    upload_date: '2024-08-15',
    is_carousel: false,
    formats: {
      video: [
        { format_id: '2160p', resolution: '4K Ultra HD', ext: 'mp4', filesize_estimate: '480 MB', fps: 60, badge: 'Ultra HD', note: 'Highest fidelity' },
        { format_id: '1080p', resolution: '1080p Full HD', ext: 'mp4', filesize_estimate: '145 MB', fps: 60, badge: 'Recommended', note: 'Fast & crisp' },
        { format_id: '720p', resolution: '720p HD', ext: 'mp4', filesize_estimate: '68 MB', fps: 30, badge: 'Standard', note: 'Lightweight' },
        { format_id: '480p', resolution: '480p SD', ext: 'mp4', filesize_estimate: '32 MB', fps: 30, badge: 'Mobile', note: 'Data saver' }
      ],
      audio: [
        { format_id: 'mp3-320', type: 'mp3', quality: '320 kbps', ext: 'mp3', filesize_estimate: '10.2 MB', label: 'MP3 Universal HQ (320kbps)', description: 'Maximum fidelity universal audio format' },
        { format_id: 'm4a-aac', type: 'm4a', quality: 'Original AAC', ext: 'm4a', filesize_estimate: '6.8 MB', label: 'M4A Fast Direct Stream', description: 'Original native stream without transcoding' }
      ]
    }
  };
}

export function getMockCarouselData() {
  return {
    id: 'ig-carousel-demo',
    url: 'https://instagram.com/p/demo-carousel',
    title: 'Architectural Studies: Minimalist Concrete & Warm Scandinavian Oak',
    uploader: 'Studio Forma & Space',
    uploader_id: '@studioforma',
    platform: 'instagram',
    duration: null,
    duration_formatted: '4 Media Items',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description: 'A curated photographic walkthrough of our latest residential project in Copenhagen. Exploring tactile textures, natural filtered southern daylight, and structural spatial balance.',
    view_count: '84,320',
    upload_date: '2024-09-02',
    is_carousel: true,
    carousel_items: [
      {
        id: 'item-1',
        index: 1,
        type: 'image',
        thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=90',
        title: 'Main Living Pavilion & Clerestory Windows',
        filesize: '4.8 MB',
        resolution: '2400 x 3000'
      },
      {
        id: 'item-2',
        index: 2,
        type: 'video',
        thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=90',
        title: 'Interior Daylight Walkthrough & Acoustic Resonance',
        duration_formatted: '00:24',
        filesize: '14.2 MB',
        resolution: '1080 x 1920'
      },
      {
        id: 'item-3',
        index: 3,
        type: 'image',
        thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90',
        title: 'Handcrafted Fluted Oak Kitchen Island Detail',
        filesize: '3.9 MB',
        resolution: '2400 x 3000'
      },
      {
        id: 'item-4',
        index: 4,
        type: 'image',
        thumbnail: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=90',
        title: 'Courtyard Reflection Pool at Golden Hour',
        filesize: '5.1 MB',
        resolution: '2400 x 3000'
      }
    ],
    formats: {
      video: [
        { format_id: 'original', resolution: 'Original Quality', ext: 'mp4', filesize_estimate: '28 MB', fps: 30, badge: 'Lossless', note: 'Direct feed' }
      ],
      audio: [
        { format_id: 'mp3-320', type: 'mp3', quality: '320 kbps', ext: 'mp3', filesize_estimate: '2.1 MB', label: 'MP3 Universal HQ', description: 'Extracted audio track' }
      ]
    }
  };
}

export function getMockTwitterData() {
  return {
    id: 'tw-status-demo',
    url: 'https://x.com/demo-status',
    title: 'Next-Gen Robotics: Autonomous Quadruped Agility Demonstration on Rocky Terrain',
    uploader: 'Frontier Dynamics',
    uploader_id: '@FrontierDyn',
    platform: 'twitter',
    duration: 62,
    duration_formatted: '01:02',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    description: 'Real-time neural locomotion policy deployed zero-shot on irregular outdoor boulders. Zero tether, 100% onboard compute with dynamic stabilization.',
    view_count: '542,100',
    upload_date: '2024-09-18',
    is_carousel: false,
    formats: {
      video: [
        { format_id: '1080p', resolution: '1080p Full HD', ext: 'mp4', filesize_estimate: '34 MB', fps: 60, badge: 'Crisp', note: 'Original source' },
        { format_id: '720p', resolution: '720p HD', ext: 'mp4', filesize_estimate: '18 MB', fps: 30, badge: 'Standard', note: 'Fast' }
      ],
      audio: [
        { format_id: 'mp3-320', type: 'mp3', quality: '320 kbps', ext: 'mp3', filesize_estimate: '2.5 MB', label: 'MP3 Universal HQ', description: 'Crisp MP3 extraction' },
        { format_id: 'm4a-aac', type: 'm4a', quality: 'Original AAC', ext: 'm4a', filesize_estimate: '1.8 MB', label: 'M4A Fast Stream', description: 'Direct audio pass' }
      ]
    }
  };
}
