/**
 * Parses any video link (YouTube, Vimeo, or direct MP4/WebM) into an embeddable format
 * @param {string} url - The video URL or link
 * @returns {{ type: 'youtube' | 'vimeo' | 'direct' | null, embedUrl: string | null, originalUrl: string }}
 */
export const parseVideoUrl = (url) => {
  if (!url || typeof url !== "string") {
    return { type: null, embedUrl: null, originalUrl: "" };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { type: null, embedUrl: null, originalUrl: "" };
  }

  // 1. YouTube Matcher
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID, youtube.com/v/ID
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
      originalUrl: trimmed,
      videoId: ytMatch[1],
    };
  }

  // 2. Vimeo Matcher
  // Matches: vimeo.com/ID, player.vimeo.com/video/ID
  const vimeoMatch = trimmed.match(
    /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      originalUrl: trimmed,
      videoId: vimeoMatch[1],
    };
  }

  // 3. Direct HTML5 Video (.mp4, .webm, .mov, localhost uploads, etc.)
  return {
    type: "direct",
    embedUrl: null,
    originalUrl: trimmed,
  };
};

export default parseVideoUrl;
