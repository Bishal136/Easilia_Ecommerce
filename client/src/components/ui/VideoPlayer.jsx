import React from "react";
import { parseVideoUrl } from "../../utils/videoUtils";

export const VideoPlayer = ({
  url,
  className = "",
  controls = true,
  autoPlay = false,
}) => {
  if (!url) return null;

  const parsed = parseVideoUrl(url);

  if (!parsed.type) return null;

  if (parsed.type === "youtube" || parsed.type === "vimeo") {
    return (
      <div
        className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg ${className}`}
      >
        <iframe
          src={parsed.embedUrl}
          title="Product Video Demo"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct video file
  return (
    <div
      className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg flex items-center justify-center ${className}`}
    >
      <video
        src={parsed.originalUrl}
        controls={controls}
        autoPlay={autoPlay}
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default VideoPlayer;
