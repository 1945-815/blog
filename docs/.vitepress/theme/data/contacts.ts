export type ContactId = 'github' | 'qq' | 'bilibili' | 'netease' | 'wechat'

export interface ContactLink {
  id: ContactId
  label: string
  href?: string
  value?: string
  missingHint?: string
}

// Only addresses present in the existing site or explicitly supplied by the owner are enabled.
export const contacts: ContactLink[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/1945-815' },
  { id: 'qq', label: 'QQ', href: 'https://wpa.qq.com/msgrd?v=3&uin=2175872855&site=qq&menu=yes', value: '2175872855' },
  { id: 'bilibili', label: 'BiliBili', href: 'https://space.bilibili.com/510489783?spm_id_from=333.1007.0.0' },
  { id: 'netease', label: '网易云', href: 'https://music.163.com/#/user/home?id=3580859437' },
  { id: 'wechat', label: '微信', value: 'z2645021509' }
]
