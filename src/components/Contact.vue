<template>
    <div class="list-group-item list-group-item-action" style="padding: 12px;">
        <div class="row" @click="chat">
            <div class="col-9">
                <h5>{{ name }}</h5>
            </div>
            <div class="col-3">
                <small class="text-muted">{{ datetime }}</small>
            </div>
        </div>
        <div class="row">
            <div class="col-10" @click="chat">
                <span class="text-muted">{{ userInfo.lastMessage }}</span>
            </div>
            <div class="col-2">
                <b-icon icon="x-circle" @click="removeUser"></b-icon>
            </div>
        </div>
    </div>
</template>

<script>
import alasql from "alasql"
import moment from "moment"
import { empty } from "@/utils/helper"
export default {
    name: "contact",
    props: {
        userInfo: {
            type: Object,
            default() {
                return {
                    uuid: "",
                    name: "",
                    lastMessage: "",
                    lastChatTime: "",
                }
            },
        },
    },
    data() {
        return {}
    },
    computed: {
        name() {
            if (
                !empty(this.userInfo.name) &&
                this.userInfo.name != "Anonymous"
            ) {
                return this.userInfo.name
            } else {
                return this.userInfo.uuid
            }
        },
        datetime() {
            return !empty(this.userInfo.lastChatTime)
                ? moment(
                      this.userInfo.lastChatTime,
                      "YYYY-MM-DD HH:mm:ss:SSS"
                  ).fromNow()
                : ""
        },
    },
    methods: {
        chat() {
            this.$router.push({
                name: "Chat",
                params: { uuid: this.userInfo.uuid },
            })
        },
        removeUser() {
            // 确认是否删除
            this.$bvModal
                .msgBoxConfirm("确认删除此联系人吗？", {
                    title: "删除确认",
                    size: "sm",
                    buttonSize: "sm",
                    okVariant: "danger",
                    okTitle: "是",
                    cancelTitle: "否",
                    footerClass: "p-2",
                    hideHeaderClose: false,
                    centered: true,
                })
                .then((confirmed) => {
                    if (confirmed) {
                        // 实施删除并刷新
                        alasql("DELETE FROM Neko.contact WHERE uuid = ?", [
                            this.userInfo.uuid,
                        ])
                        this.$emit("refresh")
                    }
                })
                .catch((err) => {
                    // An error occurred
                    console.log(err)
                })
        },
    },
    mounted() {},
}
</script>

<style></style>
