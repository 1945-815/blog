<script setup lang="ts">
import { ref } from 'vue'
import BrandIcon from './BrandIcon.vue'
import { contacts } from '../data/contacts'
import { copyText, isMobileDevice, openAppWithFallback } from '../utils/contactActions'

const wechat = contacts.find((contact) => contact.id === 'wechat')!
const wechatStatus = ref('')

function handleContactClick(event: MouseEvent, contact: (typeof contacts)[number]) {
  if (!contact.appHref || !contact.href || !isMobileDevice()) return
  event.preventDefault()
  openAppWithFallback(contact.appHref, contact.href)
}

async function handleWechatClick() {
  if (!wechat.copyValue) return
  const copyPromise = copyText(wechat.copyValue)
  wechatStatus.value = '正在复制微信号…'
  if (wechat.appHref) openAppWithFallback(wechat.appHref)
  wechatStatus.value = await copyPromise
    ? '微信号已复制，可在微信中搜索添加'
    : '复制失败，请检查浏览器权限'
}
</script>

<template>
  <section id="contact" class="contact-panel" aria-labelledby="contact-title">
    <h3 id="contact-title">联系我 <span aria-hidden="true">›</span></h3>
    <div class="contact-card">
      <template v-for="contact in contacts" :key="contact.id">
        <a v-if="contact.href" class="contact-pill" :href="contact.href" :aria-label="contact.label" @click="handleContactClick($event, contact)">
          <span class="contact-pill__label"><BrandIcon :name="contact.id" /><span>{{ contact.label }}</span></span>
        </a>
        <button v-else-if="contact.copyValue" class="contact-pill is-action" type="button" aria-label="微信；复制微信号并尝试打开微信" @click="handleWechatClick">
          <span class="contact-pill__label"><BrandIcon :name="contact.id" /><span>{{ contact.label }}</span></span>
        </button>
        <span v-else class="contact-pill is-unavailable" :title="contact.missingHint" :aria-label="`${contact.label}：${contact.missingHint}`" aria-disabled="true">
          <span class="contact-pill__label"><BrandIcon :name="contact.id" /><span>{{ contact.label }}</span></span>
          <small>待补充</small>
        </span>
      </template>
    </div>
    <p v-if="wechatStatus" class="contact-copy-status" role="status" aria-live="polite">{{ wechatStatus }}</p>
  </section>
</template>
