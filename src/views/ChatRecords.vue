<template>
    <div>
        <nav class="navbar navbar-light bg-light fixed-top">
            <span>{{ userInfo.name }} ({{ userInfo.uuid }})</span>
        </nav>
        <div id="records" style="overflow: auto; margin-top: 64px">
            <chat-record
                v-for="(record, index) in records"
                :key="index"
                :record="record"
            ></chat-record>
        </div>
    </div>
</template>

<script>
import alasql from "alasql"
import { empty } from "@/utils/helper"
import ChatRecord from "../components/ChatRecord.vue"
import { aesDecrypt } from "../utils/helper"
export default {
    name: "chat",
    components: { ChatRecord },
    props: {
        uuid: { type: String, default: "" },
    },
    data() {
        return {
            userInfo: { uuid: "", name: "Anonymous" },
            records: [],
        }
    },
    computed: {},
    methods: {
        hasContact() {
            let uuidCount = -1
            if (!empty(this.uuid)) {
                let uuidQuery = alasql(
                    "SELECT COUNT(uuid) FROM Neko.contact WHERE uuid = ?",
                    [this.uuid]
                )
                uuidCount = uuidQuery[0]["COUNT(uuid)"]
            } else {
                return false
            }
            return uuidCount <= 0 ? false : true
        },
        getContact() {
            let query = alasql("SELECT * FROM Neko.contact WHERE uuid = ?", [
                this.uuid,
            ])
            this.userInfo = query[0]
        },
        getChatRecord() {
            this.records = alasql(
                "SELECT * FROM Neko.chatRecord WHERE uuid = ? ORDER BY datetime ASC",
                [this.uuid]
            )
            this.records.forEach((record) => {
                record.content = aesDecrypt(
                    record.content,
                    this.$peer.userInfo.aesKey
                )
            })
        },
    },
    mounted() {
        let userInfoJson = sessionStorage.getItem("currentUserInfo")
        this.myUserInfo = JSON.parse(userInfoJson)
        if (this.hasContact()) {
            this.getContact()
            this.getChatRecord()
        }
    },
}
</script>

<style></style>
