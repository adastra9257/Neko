<template>
    <div>
        <div class="card-body">
            <h5 class="card-title">{{ userInfo.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ userInfo.uuid }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">公钥：{{ userInfo.pubKeyMd5 }}</h6>
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item list-group-item-action" @click="changeInfo">修改信息</li>
            <li class="list-group-item list-group-item-action" @click="logOut">
                注销
            </li>
        </ul>
        <bottom-nav />
    </div>
</template>

<script>
import BottomNav from '../components/BottomNav.vue'
import { logOut } from "../utils/helper"
export default {
  components: { BottomNav },
    name: "Options",
    data() {
        return {
            userInfo: {},
        }
    },
    methods: {
        changeInfo() {
            this.$router.push({ name: "Change Info" })
        },
        logOut() {
            logOut()
            this.$peer.peerDestroy()
            this.$router.replace({ name: "Login" })
        },
    },
    mounted() {
        let userJson = sessionStorage.getItem("currentUserInfo")
        this.userInfo = JSON.parse(userJson)
    },
}
</script>

<style></style>
