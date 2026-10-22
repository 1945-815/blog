export type ContactId = 'github' | 'qq' | 'bilibili' | 'netease'

export interface ContactLink {
  id: ContactId
  label: string
  href?: string
  missingHint?: string
}

// Only addresses present in the existing site or explicitly supplied by the owner are enabled.
export const contacts: ContactLink[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/1945-815' },
  { id: 'qq', label: 'QQ', missingHint: '请补充 QQ 号或个人联系链接' },
  { id: 'bilibili', label: 'BiliBili', missingHint: '请补充 Bilibili 个人主页地址' },
  { id: 'netease', label: '网易云', missingHint: '请补充网易云音乐个人主页地址' }
]
