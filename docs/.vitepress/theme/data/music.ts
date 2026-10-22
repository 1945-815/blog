export interface Track {
  title: string
  artist: string
  src: string
  cover?: string
}

// Add only audio the site owner has permission to publish or embed.
export const tracks: Track[] = []
