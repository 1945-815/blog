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
export const friends: FriendLink[] = [
  {
    "name": "Memory | The past",
    "url": "https://mxwqwq.github.io/",
    "description": "过去从未逝去，它甚至从未过去",
    "category": "个人博客",
    "tags": []
  }
]

export const friendApplicationUrl = 'https://github.com/1945-815/blog/issues/new?template=friend-link.yml'
