<template>
    <div class="container">
        <b-input-group class="mt-3">
            <b-form-input placeholder="UUID" v-model="uuid" @keyup.enter="addContact"></b-form-input>
            <b-input-group-append>
                <b-button variant="primary" @click="addContact">添加</b-button>
            </b-input-group-append>
        </b-input-group>
        <br />
        <p>{{ error }}</p>
        <bottom-nav />
    </div>
</template>

<script>
import alasql from "alasql"
import { validate as uuidValidate } from "uuid"
import BottomNav from "../components/BottomNav.vue"
import { getTimeNow } from "@/utils/helper"
export default {
    components: { BottomNav },
    name: "add-contacts",
    data() {
        return {
            uuid: "",
            error: "",
        }
    },
    methods: {
        addContact() {
            let uuidValid = uuidValidate(this.uuid)
            let uuidQuery = alasql(
                "SELECT COUNT(uuid) FROM Neko.contact WHERE uuid = ?",
                [this.uuid]
            )
            let uuidCount = uuidQuery[0]["COUNT(uuid)"]
            if (!uuidValid) {
                this.error = "UUID格式错误！"
            } else if (uuidCount != 0) {
                this.$router.push({ name: "Chat", params: { uuid: this.uuid } }) // 导航到会话
            } else {
                // 将指定用户加入通讯录数据库
                alasql("INSERT INTO Neko.contact VALUES (?, ?, ?, ?, ?)", [
                    this.uuid,
                    "Anonymous",
                    "",
                    "",
                    getTimeNow(),
                ])
                // 导航到会话
                this.$router.push({ name: "Chat", params: { uuid: this.uuid } })
            }
        },
    },
}
</script>

<style></style>
