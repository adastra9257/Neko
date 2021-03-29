<template>
    <div id="app" class="container" style="padding: 0;">
        <router-view ref="view" />
    </div>
</template>

<script>
import { initialize, isAuthenticated } from "./utils/helper"

export default {
  components: { },
    name: "Neko",
    data() {
        return {}
    },
    computed: {},
    methods: {
        createPeer() {
            let userInfoJson = sessionStorage.getItem("currentUserInfo")
            let userInfo = JSON.parse(userInfoJson)
            this.$peer.peerInit(userInfo)
        },
    },
    mounted() {
        // 初始化
        initialize()
        // 未登录者强制转移到登录页面
        if (!isAuthenticated()) {
            this.$router.replace({ name: "Login" })
        } else {
            // 已登录者初始化 Peer
            this.createPeer()
        }
    },
}
</script>

<style lang="scss"></style>
