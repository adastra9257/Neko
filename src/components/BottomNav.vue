<template>
    <div
        class="btn-group fixed-bottom"
        role="group"
        aria-label="Bottom Operations"
    >
        <router-link to="/contacts" class="btn btn-secondary">通讯</router-link>
        <router-link to="/options" class="btn btn-secondary">设置</router-link>
    </div>
</template>

<script>
export default {
    name: "bottom-nav"
}
</script>

<style></style>
