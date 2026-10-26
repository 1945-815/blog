<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { Music2, Play, Pause, SkipBack, SkipForward, ListMusic, Repeat, Shuffle, ChevronDown, ChevronUp, Volume2, X } from 'lucide-vue-next'
import type { Track } from '../data/music'
import { tracks } from '../data/music'

type RepeatMode = 'off' | 'all' | 'one'
const storageKey = 'cyzee-music-preferences-v1'
const audio = ref<HTMLAudioElement | null>(null)
const panelOpen = ref(false)
const currentIndex = ref(-1)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.72)
const shuffle = ref(false)
const repeatMode = ref<RepeatMode>('all')
const isPlaying = ref(false)
const error = ref('')
const lastSavedSecond = ref(-1)
const currentTrack = computed(() => tracks[currentIndex.value] || null)

function sourceUrl(source: string) { return /^https?:\/\//i.test(source) ? source : withBase(source.startsWith('/') ? source : `/${source}`) }
function coverUrl(track: Track) { return track.cover ? sourceUrl(track.cover) : '' }
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}
function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ index: currentIndex.value, volume: volume.value, shuffle: shuffle.value, repeat: repeatMode.value, position: Math.floor(currentTime.value) }))
  } catch { /* Storage may be unavailable in private browsing. */ }
}
function onTimeUpdate() {
  currentTime.value = audio.value?.currentTime || 0
  const second = Math.floor(currentTime.value)
  if (second > 0 && second % 5 === 0 && second !== lastSavedSecond.value) { lastSavedSecond.value = second; persist() }
}
function onMetadata() {
  duration.value = audio.value?.duration || 0
  if (restorePosition.value > 0 && restorePosition.value < duration.value && audio.value) audio.value.currentTime = restorePosition.value
}
const restorePosition = ref(0)

async function playTrack(index: number, autoplay: boolean) {
  if (!tracks.length) return
  currentIndex.value = (index + tracks.length) % tracks.length
  restorePosition.value = 0
  currentTime.value = 0
  error.value = ''
  await nextTick()
  if (autoplay && audio.value) {
    try { await audio.value.play() }
    catch (cause) { setPlaybackError(cause) }
  }
  persist()
}

function setPlaybackError(cause: unknown) {
  const name = typeof cause === 'object' && cause !== null && 'name' in cause
    ? String((cause as { name?: unknown }).name)
    : ''
  error.value = name === 'NotAllowedError'
    ? '浏览器阻止了自动播放，请点击播放键开始。'
    : '当前音源无法播放，请检查地址或授权。'
}

async function startPlaybackOnLoad() {
  restore()
  if (!tracks.length) return
  if (currentIndex.value < 0) currentIndex.value = 0
  await nextTick()
  if (!audio.value) return
  audio.value.volume = volume.value
  try {
    await audio.value.play()
    error.value = ''
  } catch (cause) {
    setPlaybackError(cause)
  }
}

async function togglePlay() {
  if (!tracks.length) return
  if (currentIndex.value < 0) { await playTrack(0, true); return }
  if (!audio.value) return
  if (audio.value.paused) {
    try { await audio.value.play(); error.value = '' }
    catch (cause) { setPlaybackError(cause) }
  } else audio.value.pause()
}

function nextIndex() {
  if (!tracks.length) return -1
  if (shuffle.value && tracks.length > 1) {
    let next = currentIndex.value
    while (next === currentIndex.value) next = Math.floor(Math.random() * tracks.length)
    return next
  }
  return (currentIndex.value + 1) % tracks.length
}
function nextTrack(autoplay = isPlaying.value) { if (tracks.length) void playTrack(nextIndex(), autoplay) }
function previousTrack() {
  if (!tracks.length) return
  if (audio.value && audio.value.currentTime > 3) { audio.value.currentTime = 0; return }
  const previous = currentIndex.value < 0 ? 0 : (currentIndex.value - 1 + tracks.length) % tracks.length
  void playTrack(previous, isPlaying.value)
}
function seek(value: string) { const target = Number(value); if (audio.value && Number.isFinite(target)) { audio.value.currentTime = target; currentTime.value = target; persist() } }
function setVolume(value: string) { volume.value = Math.min(1, Math.max(0, Number(value))); persist() }
function cycleRepeat() { repeatMode.value = repeatMode.value === 'all' ? 'one' : repeatMode.value === 'one' ? 'off' : 'all'; persist() }
function onEnded() {
  if (repeatMode.value === 'all' && tracks.length > 1) { nextTrack(true); return }
  if (repeatMode.value === 'all' && tracks.length === 1 && audio.value) {
    audio.value.currentTime = 0
    void audio.value.play().catch(setPlaybackError)
    return
  }
  isPlaying.value = false
}
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (Number.isInteger(saved.index) && saved.index >= 0 && saved.index < tracks.length) { currentIndex.value = saved.index; restorePosition.value = Number(saved.position) || 0 }
    if (Number.isFinite(saved.volume)) volume.value = Math.max(0, Math.min(1, saved.volume))
    shuffle.value = Boolean(saved.shuffle)
    if (saved.repeat === 'off' || saved.repeat === 'all' || saved.repeat === 'one') repeatMode.value = saved.repeat
  } catch { /* Ignore invalid or unavailable local preferences. */ }
}
watch(volume, (value) => { if (audio.value) audio.value.volume = value })
watch(currentTrack, () => { if (audio.value) audio.value.volume = volume.value })
onMounted(() => { void startPlaybackOnLoad() })
</script>

<template>
  <div class="music-player" :class="{ expanded: panelOpen, 'has-track': currentTrack }">
    <button class="music-player-toggle" type="button" :aria-expanded="panelOpen" aria-controls="music-player-panel" @click="panelOpen = !panelOpen"><Music2 :size="17" aria-hidden="true" /><span>{{ currentTrack?.title || '音乐' }}</span><span v-if="isPlaying" class="music-playing-indicator" aria-label="正在播放"><i></i><i></i><i></i></span><ChevronUp v-if="panelOpen" :size="15" /><ChevronDown v-else :size="15" /></button>
    <button v-if="currentTrack" class="music-quick-play" type="button" :aria-label="isPlaying ? '暂停音乐' : '继续播放音乐'" @click="togglePlay"><Pause v-if="isPlaying" :size="17" /><Play v-else :size="17" /></button>
    <audio ref="audio" :src="currentTrack ? sourceUrl(currentTrack.src) : undefined" :loop="repeatMode === 'one'" preload="none" @play="isPlaying = true" @pause="isPlaying = false" @timeupdate="onTimeUpdate" @loadedmetadata="onMetadata" @ended="onEnded" @error="error = '当前音源暂不可用。'" />

    <section v-if="panelOpen" id="music-player-panel" class="music-player-panel" aria-label="音乐播放器">
      <header><div><p class="section-eyebrow">MUSIC PLAYER</p><h2>音乐</h2></div><button type="button" aria-label="收起播放器" @click="panelOpen = false"><X :size="18" /></button></header>
      <div v-if="currentTrack" class="music-now-playing">
        <img v-if="coverUrl(currentTrack)" :src="coverUrl(currentTrack)" :alt="`${currentTrack.title} 封面`" loading="lazy" />
        <span v-else class="music-cover-fallback"><Music2 :size="23" aria-hidden="true" /></span>
        <div><strong>{{ currentTrack.title }}</strong><span>{{ currentTrack.artist }}</span></div>
      </div>
      <p v-else class="music-empty-state">还没有添加可用曲目。请在音乐数据配置中加入拥有使用权的音源。</p>
      <div v-if="tracks.length" class="music-controls">
        <input class="music-progress" type="range" min="0" :max="duration || 0" step="1" :value="currentTime" aria-label="播放进度" @input="seek(($event.target as HTMLInputElement).value)" />
        <div class="music-time-row"><time>{{ formatTime(currentTime) }}</time><time>{{ formatTime(duration) }}</time></div>
        <div class="music-button-row"><button type="button" aria-label="上一首" @click="previousTrack"><SkipBack :size="17" /></button><button type="button" class="music-play-button" :aria-label="isPlaying ? '暂停' : '播放'" @click="togglePlay"><Pause v-if="isPlaying" :size="18" /><Play v-else :size="18" /></button><button type="button" aria-label="下一首" @click="nextTrack()"><SkipForward :size="17" /></button><button type="button" :class="{ active: shuffle }" :aria-pressed="shuffle" aria-label="随机播放" @click="shuffle = !shuffle; persist()"><Shuffle :size="16" /></button><button type="button" :class="{ active: repeatMode !== 'off' }" :aria-label="`循环模式：${repeatMode === 'all' ? '列表循环' : repeatMode === 'one' ? '单曲循环' : '关闭'}`" @click="cycleRepeat"><Repeat :size="16" /><small v-if="repeatMode === 'one'">1</small></button></div>
        <label class="music-volume"><Volume2 :size="16" aria-hidden="true" /><input type="range" min="0" max="1" step="0.01" :value="volume" aria-label="音量" @input="setVolume(($event.target as HTMLInputElement).value)" /></label>
        <p v-if="error" class="music-error" role="status">{{ error }}</p>
        <details class="music-playlist"><summary><ListMusic :size="15" />播放列表（{{ tracks.length }}）</summary><ol><li v-for="(track, index) in tracks" :key="`${track.src}-${index}`"><button type="button" :class="{ current: currentIndex === index }" @click="playTrack(index, true)"><span>{{ track.title }}</span><small>{{ track.artist }}</small></button></li></ol></details>
      </div>
      <a class="music-page-link" :href="withBase('/music/')">音乐页面 <span aria-hidden="true">↗</span></a>
    </section>
  </div>
</template>
