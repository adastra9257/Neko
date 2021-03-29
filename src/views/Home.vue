<template>
    <div>
        <div id="nav">
            <router-link to="/">Home</router-link>,
            <a href="#">Logout</a>
        </div>
    </div>
</template>

<script>
// @ is an alias to /src
import { isAuthenticated } from "../utils/helper"

export default {
    name: "Home",
    components: {},
    computed: {
        isAuthed() {
            return isAuthenticated()
        },
    },
    methods: {},
}
</script>
