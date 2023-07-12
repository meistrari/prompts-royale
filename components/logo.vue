<script lang="ts" setup>
</script>

<template>
    <div
        font-bold text-6 cursor-pointer
        hover:translate-y--2px
        active:translate-y-2px
        transition
        @click="navigateTo('/')"
    >
        Prompts<span text-indigo-6>Royale</span>
    </div>
</template>
