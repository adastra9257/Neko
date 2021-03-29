<template>
    <nav class="navbar navbar-light bg-light fixed-top">
        <a class="navbar-brand">Neko</a>
        <b-icon icon="plus-circle" @click="addContact"></b-icon>
    </nav>
</template>

<script>
export default {
    name: "nav-bar",
    props: {},
    data() {
        return {}
    },
    methods: {
        addContact() {
            this.$router.push({ name: "Add Contact" } )
        }
    }
}
</script>

<style></style>
