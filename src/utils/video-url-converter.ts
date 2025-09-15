/**
 * Converts YouTube and Vimeo URLs to their embed format
 */
export function convertVideoToEmbedUrl(url: string): string {
  if (!url) return url;

  // YouTube conversion: ?v={id} or /watch?v={id} -> /embed/{id}
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);

  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // Vimeo conversion: vimeo.com/{id} -> player.vimeo.com/video/{id}
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);

  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  // Return original URL if no match found
  return url;
}
