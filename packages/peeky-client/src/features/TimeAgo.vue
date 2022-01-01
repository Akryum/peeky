<script lang="ts" setup>
import { computed, onUnmounted, PropType, ref, watchEffect } from 'vue'

const props = defineProps({
  date: {
    type: [Object, String, Number] as PropType<Date | string | number>,
    required: true,
  },
})

const parsedDate = computed(() => new Date(props.date))

const display = ref('')
const interval = ref(1)

const rtf = new Intl.RelativeTimeFormat(undefined, {
  style: 'narrow',
  numeric: 'auto',
})

const units: ([number, Intl.RelativeTimeFormatUnit])[] = [[60, 'minute'], [60, 'hour'], [24, 'day']]

function update () {
  let diff = (parsedDate.value.getTime() - Date.now()) / 1000
  let unit: Intl.RelativeTimeFormatUnit = 'second'
  let newInterval = 1000
  for (let index = 0; index < units.length; index++) {
    const newDiff = diff / units[index][0]
    if (Math.abs(newDiff) < 1) {
      index--
      break
    }
    diff = newDiff
    unit = units[index][1]
    newInterval *= units[index][0]
  }

  display.value = rtf.format(Math.round(diff), unit)
  interval.value = newInterval
}

update()

let timer: ReturnType<typeof setInterval>

watchEffect(() => {
  clearInterval(timer)
  timer = setInterval(() => {
    update()
  }, interval.value)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  {{ display }}
</template>
