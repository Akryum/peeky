---
sidebar: false
heroImage: /logo.svg

actionText: Get Started
actionLink: /guide/

altActionText: Learn More
altActionLink: /guide/introduction

features:
  - title: ⚡️ Fast
    details: Peeky is built from the ground up for optimal performance.
  - title: 🔧️ No-config
    details: Sane defaults, with cutomizable configuration.
  - title: 😻️ Fun
    details: The included UI makes running tests fun again!

footer: MIT Licensed | Copyright © 2021-present Guillaume Chau & Peeky Contributors
---

<script setup>
import CustomHome from '/.vitepress/theme/components/Home.vue'
import Features from './Features.vue'
</script>

<CustomHome>
  <template v-slot:hero>
    <img class="screenshot" src="/home-screenshot.png" alt="Screenshot">
  </template>

  <template v-slot:default>
    <div class="space-y-12 mb-12">
      <Features/>
    </div>
  </template>
</CustomHome>

<style scoped>
.screenshot {
  box-shadow: 0 3px 24px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}
</style>
