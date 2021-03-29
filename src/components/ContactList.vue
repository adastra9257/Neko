<template>
    <div class="list-group">
        <contact
            v-for="(userInfo, index) in userInfoArr"
            :key="index"
            :user-info="userInfo"
            @refresh="refresh"
        ></contact>
    </div>
</template>

<script>
import Contact from "../components/Contact.vue"

export default {
    name: "contact-list",
    components: { Contact },
    props: {
        userInfoArr: {
            type: Array,
            default() {
                return []
            },
        },
    },
    data() {
        return {}
    },
    methods: {
        refresh() {
            this.$emit("refresh")
        }
    }
}
</script>

<style></style>
