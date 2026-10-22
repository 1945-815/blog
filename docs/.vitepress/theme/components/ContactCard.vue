<script setup lang="ts">
import BrandIcon from './BrandIcon.vue'
import { contacts } from '../data/contacts'
</script>

<template>
  <section id="contact" class="contact-panel" aria-labelledby="contact-title">
    <h3 id="contact-title">联系我 <span aria-hidden="true">›</span></h3>
    <div class="contact-card">
      <template v-for="contact in contacts" :key="contact.id">
        <a v-if="contact.href" class="contact-pill" :href="contact.href" target="_blank" rel="noopener noreferrer">
          <BrandIcon :name="contact.id" />
          <span>{{ contact.label }}</span>
        </a>
        <span v-else class="contact-pill is-unavailable" :title="contact.missingHint" :aria-label="`${contact.label}：${contact.missingHint}`" aria-disabled="true">
          <BrandIcon :name="contact.id" />
          <span>{{ contact.label }}</span>
          <small>待补充</small>
        </span>
      </template>
    </div>
  </section>
</template>
