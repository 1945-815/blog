export interface Moment {
  id: string
  content: string
  publishedAt: string
  images?: { src: string; alt: string; caption?: string }[]
  tags?: string[]
  mood?: string
  pinned?: boolean
}

// Add an entry when there is a real note to publish; no sample personal stories are included.
export const moments: Moment[] = []
