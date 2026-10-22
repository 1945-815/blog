export interface AlbumPhoto {
  src: string
  alt: string
  caption?: string
  takenAt?: string
}

export interface PhotoAlbum {
  id: string
  title: string
  category: string
  description: string
  cover?: string
  photos: AlbumPhoto[]
}

// Public albums stay empty until the owner provides real photos and captions.
export const publicAlbums: PhotoAlbum[] = []
