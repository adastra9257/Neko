<template>
    <div style="margin-bottom: 0.5rem;">
        <div>{{ displayName }} ({{ record.datetime }}):</div>
        <div>{{ record.content }}</div>
    </div>
</template>

<script>
import { empty } from "@/utils/helper"
export default {
    name: "chat-record",
    props: {
        record: {
            type: Object,
            default() {
                return {
                    uuid: "",
                    name: "",
                    datetime: "",
                    content: "",
                    isSender: "",
                }
            },
        },
        name: { type: String, default: "" }
    },
    computed: {
        displayName() {
            return (this.record.isSender == true || this.record.isSender == "true") // 是自己发送则显示“我”
                ? "我"
                : !empty(this.name) // 优先显示 Props 的 name
                ? this.name
                : !empty(this.record.name) // 优先显示 Props 的 record.name
                ? this.record.name
                : `${this.record.uuid.slice(0, 6)}...` // 最次显示 UUID
        },
    },
}
</script>
