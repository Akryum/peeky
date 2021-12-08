---
sidebar: false
heroImage: /logo.svg
tagline: A test framework for the curious minds

actionText: Get Started
actionLink: /guide/

altActionText: Learn More
altActionLink: /guide/introduction

features:
  - title: 🚀️ Fast
    details: Peeky is built from the ground up for optimal performance. Run test faster!
  - title: 🔧️ No-config
    details: Sane defaults, with extensive configuration if needed.
  - title: 😻️ Fun
    details: The included UI makes running tests fun again! Hack it with the API!
  - title: 🖥️ Node support
    details: Test your Node.js libraries and apps, with native ESM support!
  - title: ⚡️ Vite powered
    details: Seamlessly integrate with your Vite app. TypeScript support included.
  - title: 🌐️ Web apps
    details: Test your web apps and components made with React, Vue, Angular, etc.

footer: MIT Licensed | Copyright © 2021-present Guillaume Chau & Peeky Contributors
---

<script setup>
import CustomHome from '/.vitepress/theme/components/CustomHome.vue'
import Features from './Features.vue'
import HomeScreenshot from './HomeScreenshot.vue'
</script>

<CustomHome>
  <template v-slot:hero>
    <HomeScreenshot />
  </template>
  <div class="space-y-4 mb-12">
    <Features/>
  </div>
</CustomHome>
