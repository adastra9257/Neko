<template>
    <div>
        <nav-bar />
        <div style="overflow: auto; margin-top: 56px; margin-bottom: 38px">
            <contact-list
                :userInfoArr="userInfoArr"
                @refresh="getUserInfoArr"
            />
        </div>
        <bottom-nav />
    </div>
</template>

<script>
import alasql from "alasql"
import NavBar from "../components/NavBar.vue"
import BottomNav from "../components/BottomNav.vue"
import ContactList from "../components/ContactList.vue"
import { EventBus } from "@/plugins/event-bus.js"
import { aesDecrypt } from "@/utils/helper"

export default {
    name: "contacts",
    components: { NavBar, BottomNav, ContactList },
    data() {
        return {
            userInfoArr: [],
        }
    },
    methods: {
        getUserInfoArr() {
            this.userInfoArr = alasql(
                "SELECT * FROM Neko.contact ORDER BY lastChatTime DESC"
            )
            this.userInfoArr.forEach((contact) => {
                contact.lastMessage = aesDecrypt(
                    contact.lastMessage,
                    this.$peer.userInfo.aesKey
                )
            })
        },
    },
    mounted() {
        this.getUserInfoArr()
        EventBus.$on("connected", () => {
            this.getUserInfoArr()
        })
    },
}
</script>

<style></style>
