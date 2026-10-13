<script setup lang="ts">
import { MessageCircle, QrCode } from 'lucide-vue-next'
import QrcodeVue from 'qrcode.vue'
</script>

<template>
  <div class="contact-card" aria-label="联系方式">
    <div class="contact-item">
      <button type="button" aria-describedby="wechat-tooltip"><MessageCircle :size="16" :stroke-width="1.8" aria-hidden="true" /><span>微信</span></button>
      <div id="wechat-tooltip" class="contact-popover" role="tooltip">微信号：<strong>z2645021509</strong></div>
    </div>
    <div class="contact-item contact-qq">
      <button type="button" aria-label="QQ 二维码，悬停或聚焦查看" aria-describedby="qq-tooltip"><QrCode :size="17" :stroke-width="1.8" aria-hidden="true" /><span>QQ</span></button>
      <div id="qq-tooltip" class="contact-popover contact-qr-popover" role="tooltip">
        <QrcodeVue value="zyc545@qq.com" :size="136" level="M" render-as="svg" />
        <span>QQ：zyc545@qq.com</span>
      </div>
    </div>
  </div>
</template>
