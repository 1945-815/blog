<script setup lang="ts">
import BrandIcon from './BrandIcon.vue'
import { contacts } from '../data/contacts'
</script>

<template>
  <section id="contact" class="contact-panel" aria-labelledby="contact-title">
    <h3 id="contact-title">联系我 <span aria-hidden="true">›</span></h3>
    <div class="contact-card">
      <template v-for="contact in contacts" :key="contact.id">
        <a v-if="contact.href" class="contact-pill" :href="contact.href" target="_blank" rel="noopener noreferrer" :aria-label="contact.value ? `${contact.label}：${contact.value}` : contact.label">
          <span class="contact-pill__label"><BrandIcon :name="contact.id" /><span>{{ contact.label }}</span></span>
          <small v-if="contact.value">{{ contact.value }}</small>
        </a>
        <span v-else-if="contact.value" class="contact-pill is-informational" :aria-label="`${contact.label}：${contact.value}`">
          <span class="contact-pill__label"><BrandIcon :name="contact.id" /><span>{{ contact.label }}</span></span>
          <small>{{ contact.value }}</small>
        </span>
        <span v-else class="contact-pill is-unavailable" :title="contact.missingHint" :aria-label="`${contact.label}：${contact.missingHint}`" aria-disabled="true">
          <span class="contact-pill__label"><BrandIcon :name="contact.id" /><span>{{ contact.label }}</span></span>
          <small>待补充</small>
        </span>
      </template>
    </div>
  </section>
</template>
