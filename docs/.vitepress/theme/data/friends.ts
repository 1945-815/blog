export interface FriendLink {
  name: string
  url: string
  description: string
  category: string
  logo?: string
  tags?: string[]
  unavailable?: boolean
}

// Keep this list empty until real sites and owners have been confirmed.
export const friends: FriendLink[] = []

export const friendApplicationUrl = 'https://github.com/1945-815/blog/issues/new?template=friend-link.yml'
