<template>
    <div>
        <nav class="navbar navbar-light bg-light fixed-top">
            <span
                >「{{ online ? "已连接" : "未连接" }}」{{ userInfo.name }} ({{
                    userInfo.uuid
                }})</span
            >
        </nav>
        <div
            id="chat-records"
            style="overflow: auto; margin-top: 5rem; margin-bottom: 3rem"
        >
            <chat-record
                v-for="(record, index) in records"
                :key="index"
                :record="record"
                :name="userInfo.name"
            ></chat-record>
        </div>
        <div class="input-group fixed-bottom">
            <input
                type="text"
                class="form-control"
                placeholder="请输入......"
                aria-label="消息"
                aria-describedby="send-button"
                v-model="message"
                @keyup.enter="send"
            />
            <div class="input-group-append">
                <button
                    class="btn btn-outline-secondary"
                    type="button"
                    id="send-button"
                    @click="send"
                >
                    发送
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import alasql from "alasql"
import { empty, aesDecrypt, getTimeNow, debug } from "@/utils/helper"
import ChatRecord from "../components/ChatRecord.vue"
import { EventBus } from "@/plugins/event-bus.js"

export default {
    name: "chat",
    components: { ChatRecord },
    props: {
        uuid: { type: String, default: "" },
    },
    data() {
        return {
            userInfo: { uuid: "", name: "Anonymous" },
            myUserInfo: {},
            records: [],
            online: false,
            message: "",
        }
    },
    computed: {},
    methods: {
        addContact() {
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
            if (uuidCount <= 0) {
                // 将指定用户加入通讯录数据库
                alasql("INSERT INTO Neko.contact VALUES (?, ?, ?, ?, ?)", [
                    this.uuid,
                    "Anonymous",
                    "",
                    "",
                    getTimeNow(),
                ])
            }
            return true
        },
        getContact() {
            let query = alasql("SELECT * FROM Neko.contact WHERE uuid = ?", [
                this.uuid,
            ])
            this.userInfo = query[0]
            debug("Get Contact:")
            debug(this.userInfo)
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
            this.scrollChatToBottom()
        },
        connect() {
            this.$peer.connect(this.userInfo.uuid)
        },
        send() {
            let data = {
                uuid: this.uuid,
                message: this.message,
            }
            this.$peer.send(data.uuid, data.message)
            this.message = ""
            this.scrollChatToBottom()
        },
        scrollChatToBottom() {
            let scrollDom = document.getElementById("chat-records")
            scrollDom.scrollTop = scrollDom.scrollHeight
        },
    },
    mounted() {
        let userInfoJson = sessionStorage.getItem("currentUserInfo")
        this.myUserInfo = JSON.parse(userInfoJson)
        if (this.addContact()) {
            this.getContact()
            this.getChatRecord()
            this.connect()
            EventBus.$on("connected", () => {
                this.online = true
            })
            EventBus.$on("new-content", (info) => {
                info.name = this.userInfo.name
                this.records.push(info)
                this.scrollChatToBottom()
            })
        }
    },
}
</script>

<style></style>
