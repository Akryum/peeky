<script setup>
import Feature from './Feature.vue'
</script>

<template>
  <h2 class="border-none">
    Features
  </h2>

  <div class="grid gap-4 grid-cols-1 md:grid-cols-2 auto-rows-fr">
    <Feature
      title="CLI"
      icon="terminal"
    >
      Run tests from command line
    </Feature>

    <Feature
      title="GUI"
      icon="layout"
    >
      Run and monitor tests in a visual experience
    </Feature>

    <Feature
      title="Fast build"
      icon="zap"
    >
      Build files very quickly with a binary native bundler
    </Feature>

    <Feature
      title="Parallel"
      icon="cpu"
    >
      Run tests in multiple workers by default
    </Feature>

    <Feature
      title="Typescript"
      icon="code"
    >
      Peeky supports Typescript out-of-the-box, no configuration required!
    </Feature>

    <Feature
      title="BDD"
      icon="check"
    >
      Write safer expressive assertions with <a
        href="https://github.com/moll/js-must/#mustjs"
        target="_blank"
      >Must</a>
    </Feature>

    <Feature
      title="Spies & mocks"
      icon="eye"
    >
      Check if functions are called or mock objects with <a
        href="https://sinonjs.org/"
        target="_blank"
      >Sinon</a>
    </Feature>

    <Feature
      title="Module mocks"
      icon="archive"
    >
      Mock module imports with custom implementations
    </Feature>

    <Feature
      title="Files Auto-stub"
      icon="file"
    >
      Don't write actual files to the disk during test builds &amp; runs!
    </Feature>

    <Feature
      title="Watch"
      icon="refresh-cw"
    >
      Watch and automatically re-run tests depending on modified files
    </Feature>

    <Feature
      title="Config"
      icon="settings"
    >
      Customize Peeky to your needs with a simple config file
    </Feature>

    <Feature
      title="Async/Promise support"
      icon="loader"
    >
      Included full `async/await` support
    </Feature>

    <Feature
      title="Glob/Regex matching"
      icon="search"
    >
      Use globs and/or regular expressions to find test files
    </Feature>

    <Feature
      title="Retries"
      icon="refresh-ccw"
      status="wip"
    >
      Easily retries tests &amp; assertions
    </Feature>

    <Feature
      title="Text Snaphots"
      icon="type"
      status="soon"
    >
      Compare text snapshots such as rendered HTML or file content
    </Feature>

    <Feature
      title="Web apps"
      icon="globe"
      status="soon"
    >
      Test your components (React, Vue...)
    </Feature>

    <Feature
      title="Plugins"
      icon="package"
      status="soon"
    >
      Extend Peeky with third-party plugins
    </Feature>
  </div>
</template>
