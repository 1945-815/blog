<script setup lang="ts">
import { MessageCircle } from 'lucide-vue-next'
import QqIcon from './QqIcon.vue'
</script>

<template>
  <div class="contact-card" aria-label="联系方式">
    <div class="contact-item">
      <button type="button" aria-describedby="wechat-tooltip"><MessageCircle :size="16" :stroke-width="1.8" aria-hidden="true" /><span>微信</span></button>
      <div id="wechat-tooltip" class="contact-popover" role="tooltip">微信号：<strong>z2645021509</strong></div>
    </div>
    <div class="contact-item contact-qq">
      <button type="button" aria-describedby="qq-tooltip"><QqIcon /><span>QQ</span></button>
      <div id="qq-tooltip" class="contact-popover" role="tooltip">QQ: <strong>zyc545@qq.com</strong></div>
    </div>
  </div>
</template>
