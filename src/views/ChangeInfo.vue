<template>
    <div>
        <div class="container" style="margin-top: 5rem;">
            <div class="form-group">
                <label for="login">用户名</label>
                <input
                    class="form-control"
                    id="login"
                    aria-describedby="defaultLogin"
                    v-model="login"
                />
            </div>
            <div class="form-group">
                <label for="name">昵称</label>
                <input
                    class="form-control"
                    id="name"
                    aria-describedby="defaultName"
                    v-model="name"
                />
            </div>
            <div class="form-group">
                <label for="password">密码</label>
                <input
                    type="password"
                    class="form-control"
                    id="password"
                    aria-describedby="defaultPassword"
                    v-model="password"
                />
            </div>
            <button class="btn btn-primary" @click="executeChange">保存</button>
        </div>
        <bottom-nav></bottom-nav>
    </div>
</template>

<script>
import alasql from "alasql"
import BottomNav from "../components/BottomNav.vue"
import {
    empty,
    logOut,
    pwd2AesKey,
    hashPassword,
    aesEncrypt,
    aesDecrypt,
} from "@/utils/helper"

export default {
    components: { BottomNav },
    name: "change-info",
    data() {
        return {
            login: "",
            name: "",
            password: "",
            changed: false,
        }
    },
    methods: {
        changeLogin() {
            alasql("UPDATE Neko.profile SET login = ? WHERE uuid = ?", [
                this.login,
                this.$peer.userInfo.uuid,
            ])
            this.changed = true
        },
        changeName() {
            alasql("UPDATE Neko.profile SET name = ? WHERE uuid = ?", [
                this.name,
                this.$peer.userInfo.uuid,
            ])
            this.changed = true
        },
        changePassword() {
            // 修改档案密码
            let userInfo = this.$peer.userInfo
            let uuid = userInfo.uuid
            let hashedPassword = hashPassword(this.password, uuid)
            let aesKeyOld = userInfo.aesKey
            let pubKeyRaw = aesDecrypt(userInfo.pubKey, aesKeyOld)
            let privKeyRaw = aesDecrypt(userInfo.privKey, aesKeyOld)
            let aesKey = pwd2AesKey(this.password)
            let pubKey = aesEncrypt(pubKeyRaw, aesKey)
            let privKey = aesEncrypt(privKeyRaw, aesKey)
            alasql(
                `UPDATE Neko.profile SET hashedPassword = ?, pubKey = ?, privKey = ? WHERE uuid = ?`,
                [hashedPassword, pubKey, privKey, uuid]
            )
            // 读取通讯录
            let contacts = alasql("SELECT * FROM Neko.contact")
            // 修改通讯录
            contacts.forEach((contact) => {
                let lastMessage = aesDecrypt(contact.lastMessage, aesKeyOld)
                contact.lastMessage = aesEncrypt(lastMessage, aesKey)
                alasql(
                    `UPDATE Neko.contact SET lastMessage = ? WHERE uuid = ? AND lastChatTime = ?`,
                    [contact.lastMessage, contact.uuid, contact.lastChatTime]
                )
            })
            // 读取聊天记录
            let chatRecords = alasql("SELECT * FROM Neko.chatRecord")
            // 修改聊天记录
            chatRecords.forEach((record) => {
                let content = aesDecrypt(record.content, aesKeyOld)
                record.content = aesEncrypt(content, aesKey)
                alasql(
                    `UPDATE Neko.chatRecord SET content = ? WHERE uuid = ? AND datetime = ? AND isSender = ?`,
                    [
                        record.content,
                        record.uuid,
                        record.datetime,
                        record.isSender,
                    ]
                )
            })
            // 结束
            this.changed = true
        },
        executeChange() {
            if (!empty(this.login)) {
                this.changeLogin()
            }
            if (!empty(this.name)) {
                this.changeName()
            }
            if (!empty(this.password)) {
                this.changePassword()
            }
            if (this.changed) {
                logOut()
                this.$peer.peerDestroy()
                this.$router.replace({ name: "Login" })
            }
        },
    },
}
</script>

<style></style>