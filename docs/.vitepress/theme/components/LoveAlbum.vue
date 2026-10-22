<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { LockKeyhole, Heart, Eye, EyeOff, ShieldCheck, Image as ImageIcon } from 'lucide-vue-next'
import { withBase } from 'vitepress'
import { decryptPrivateEnvelope } from '../utils/privateAlbumCrypto.js'
import PhotoDialog from './PhotoDialog.vue'
import type { ViewerPhoto } from './PhotoDialog.vue'

interface LoveEntry { date?: string; title?: string; text?: string; story?: string }
interface PrivateBundle { milestones?: LoveEntry[]; notes?: LoveEntry[]; photos?: ViewerPhoto[] }

const dialog = ref<HTMLDialogElement | null>(null)
const passwordInput = ref<HTMLInputElement | null>(null)
const password = ref('')
const showPassword = ref(false)
const busy = ref(false)
const error = ref('')
const unlocked = ref(false)
const privateBundle = ref<PrivateBundle | null>(null)
const photoIndex = ref(-1)
const photos = computed(() => privateBundle.value?.photos || [])
const timeline = computed(() => [
  ...(privateBundle.value?.milestones || []).map((entry) => ({ ...entry, kind: '纪念日' })),
  ...(privateBundle.value?.notes || []).map((entry) => ({ ...entry, kind: '记录' }))
].sort((a, b) => (a.date || '').localeCompare(b.date || '')))

function openDialog() {
  error.value = ''
  showPassword.value = false
  dialog.value?.showModal()
  nextTick(() => passwordInput.value?.focus())
}

function closeDialog() {
  dialog.value?.close()
  password.value = ''
  showPassword.value = false
  error.value = ''
}

function validateBundle(value: unknown): PrivateBundle {
  if (!value || typeof value !== 'object') throw new Error('解密后的内容格式不正确。')
  const candidate = value as PrivateBundle
  const isEntry = (entry: unknown): entry is LoveEntry => {
    if (!entry || typeof entry !== 'object') return false
    const item = entry as Record<string, unknown>
    return ['date', 'title', 'text', 'story'].every((key) => item[key] === undefined || typeof item[key] === 'string')
  }
  const milestones = Array.isArray(candidate.milestones) ? candidate.milestones.filter(isEntry) : []
  const notes = Array.isArray(candidate.notes) ? candidate.notes.filter(isEntry) : []
  const photos = Array.isArray(candidate.photos) ? candidate.photos.filter((photo): photo is ViewerPhoto =>
    Boolean(photo && typeof photo.src === 'string' && /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,/i.test(photo.src) && typeof photo.alt === 'string')
  ) : []
  return { milestones, notes, photos }
}

async function unlock() {
  if (!password.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const response = await fetch(withBase('/private/memories.enc.json'), { cache: 'no-store', credentials: 'same-origin' })
    if (response.status === 404) throw new Error('尚未找到加密记录。请先在本地加密真实记录，再将加密文件随站点发布。')
    if (!response.ok) throw new Error('加密记录暂时无法读取，请稍后再试。')
    const envelope = await response.json()
    const plaintext = await decryptPrivateEnvelope(envelope, password.value)
    const content = validateBundle(JSON.parse(plaintext))
    privateBundle.value = content
    unlocked.value = true
    password.value = ''
    dialog.value?.close()
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : ''
    error.value = message.startsWith('尚未找到') || message.startsWith('加密记录暂时') || message.startsWith('不支持') || message.startsWith('加密参数') || message.startsWith('加密文件') || message.startsWith('解密后的')
      ? message
      : '密码不正确或加密文件已损坏，请检查后重试。'
    password.value = ''
    await nextTick(() => passwordInput.value?.focus())
  } finally {
    busy.value = false
  }
}

function lockAlbum() {
  photoIndex.value = -1
  privateBundle.value = null
  unlocked.value = false
  password.value = ''
  error.value = ''
}

function changePhoto(direction: number) {
  if (!photos.value.length) return
  photoIndex.value = (photoIndex.value + direction + photos.value.length) % photos.value.length
}
</script>

<template>
  <section class="love-album-section" aria-labelledby="love-album-title">
    <article v-if="!unlocked" class="love-lock-card">
      <div class="love-lock-icon"><LockKeyhole :size="20" aria-hidden="true" /><Heart :size="14" aria-hidden="true" /></div>
      <div><p class="section-eyebrow">PRIVATE SPACE</p><h2 id="love-album-title">恋爱记录</h2><p>属于我们的专属回忆。</p></div>
      <button type="button" class="love-enter-button" @click="openDialog">输入密码进入 <span aria-hidden="true">→</span></button>
    </article>

    <div v-else class="love-unlocked-view">
      <div class="love-unlocked-heading"><div><p class="section-eyebrow">PRIVATE SPACE · 已解锁</p><h2 id="love-album-title">恋爱记录</h2></div><button type="button" class="text-back-link" @click="lockAlbum">退出并锁定 <LockKeyhole :size="15" aria-hidden="true" /></button></div>
      <div v-if="timeline.length" class="love-timeline">
        <article v-for="(entry, index) in timeline" :key="`${entry.date}-${entry.title}-${index}`" class="love-timeline-item">
          <time v-if="entry.date" :datetime="entry.date">{{ entry.date }}</time><span v-else class="love-date-unset">未填写日期</span>
          <div><span class="love-entry-kind">{{ entry.kind }}</span><h3>{{ entry.title || '记录' }}</h3><p>{{ entry.text || entry.story }}</p></div>
        </article>
      </div>
      <p v-else class="private-empty-note">这份加密记录还没有文字时间线。</p>
      <section v-if="photos.length" class="private-photo-section"><div class="section-heading"><div><p class="section-eyebrow">PRIVATE PHOTOS</p><h3>照片回忆</h3><p>只在解锁后的当前页面内呈现。</p></div></div><div class="photo-grid"><button v-for="(photo, index) in photos" :key="`${photo.alt}-${index}`" type="button" class="photo-tile" :aria-label="`预览私密照片：${photo.alt}`" @click="photoIndex = index"><img :src="photo.src" :alt="photo.alt" loading="lazy" /><span v-if="photo.caption">{{ photo.caption }}</span></button></div></section>
      <p v-else class="private-empty-note"><ImageIcon :size="17" aria-hidden="true" /> 这份加密记录还没有照片。</p>
      <p class="private-memory-note"><ShieldCheck :size="15" aria-hidden="true" /> 密码未保存；退出后，页面会清除当前解密内容。</p>
    </div>

    <dialog ref="dialog" class="love-password-dialog" aria-labelledby="love-dialog-title" @close="password = ''; showPassword = false">
      <form class="love-password-form" @submit.prevent="unlock">
        <button type="button" class="love-dialog-close" aria-label="关闭" @click="closeDialog">×</button>
        <div class="love-lock-icon"><LockKeyhole :size="20" aria-hidden="true" /><Heart :size="14" aria-hidden="true" /></div>
        <p class="section-eyebrow">PRIVATE SPACE</p><h2 id="love-dialog-title">输入密码</h2><p>密码只用于本次浏览器内解密，不会发送到服务器或写入本地存储。</p>
        <label for="love-password">访问密码</label>
        <div class="password-field"><input id="love-password" ref="passwordInput" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="off" autocapitalize="none" spellcheck="false" :disabled="busy" /><button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword"><EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" /></button></div>
        <p v-if="error" class="love-error" role="alert">{{ error }}</p>
        <button class="love-unlock-button" type="submit" :disabled="busy || !password">{{ busy ? '正在验证并解密…' : '解锁回忆' }}</button>
      </form>
    </dialog>
    <PhotoDialog v-if="photoIndex >= 0 && photos.length" :photos="photos" :index="photoIndex" @close="photoIndex = -1" @previous="changePhoto(-1)" @next="changePhoto(1)" />
  </section>
</template>
