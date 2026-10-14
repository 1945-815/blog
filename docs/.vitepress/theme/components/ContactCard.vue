<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next'
</script>

<template>
  <div class="contact-card" aria-label="联系方式">
    <div class="contact-item">
      <button type="button" aria-describedby="wechat-tooltip"><MessageCircle :size="16" :stroke-width="1.8" aria-hidden="true" /><span>微信</span></button>
      <div id="wechat-tooltip" class="contact-popover" role="tooltip">微信号：<strong>z2645021509</strong></div>
    </div>
    <div class="contact-item contact-qq">
      <span class="contact-qq-text">QQ: zyc545@qq.com</span>
    </div>
  </div>
</template>
