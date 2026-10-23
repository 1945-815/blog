export type ContactId = 'github' | 'qq' | 'bilibili' | 'netease' | 'wechat'

export interface ContactLink {
  id: ContactId
  label: string
  href?: string
  appHref?: string
  copyValue?: string
  missingHint?: string
}

// Only addresses present in the existing site or explicitly supplied by the owner are enabled.
export const contacts: ContactLink[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/1945-815' },
  {
    id: 'qq',
    label: 'QQ',
    href: 'https://wpa.qq.com/msgrd?v=3&uin=2175872855&site=qq&menu=yes',
    appHref: 'mqqwpa://im/chat?chat_type=wpa&uin=2175872855&version=1&src_type=web&web_src=oicqzone.com'
  },
  {
    id: 'bilibili',
    label: 'BiliBili',
    href: 'https://space.bilibili.com/510489783',
    appHref: 'bilibili://space/510489783'
  },
  {
    id: 'netease',
    label: '网易云',
    href: 'https://music.163.com/#/user/home?id=3580859437',
    appHref: 'orpheus://user/home?id=3580859437'
  },
  { id: 'wechat', label: '微信', appHref: 'weixin://', copyValue: 'z2645021509' }
]
