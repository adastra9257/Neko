import Vue from "vue"
import VueRouter from "vue-router"
// import Home from "@/views/Home.vue"

Vue.use(VueRouter)

const routes = [
    {
        path: "/",
        redirect: "/login",
    },
    // {
    // path: "/about",
    // name: "About",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    // component: () =>
    // import(/* webpackChunkName: "about" */ "@/views/About.vue"),
    // },
    {
        path: "/login",
        name: "Login",
        component: () => import("@/views/Login.vue"),
    },
    {
        path: "/contacts",
        name: "Contacts",
        component: () => import("@/views/Contacts.vue"),
    },
    {
        path: "/contacts/add",
        name: "Add Contact",
        component: () => import("@/views/AddContacts.vue"),
    },
    {
        path: "/chat/:uuid",
        name: "Chat",
        component: () => import("@/views/Chat.vue"),
        props: true,
    },
    {
        path: "/records/:uuid",
        name: "Chat Records",
        component: () => import("@/views/ChatRecords.vue"),
        props: true,
    },
    {
        path: "/options",
        name: "Options",
        component: () => import("@/views/Options.vue"),
    },
    {
        path: "/info",
        name: "Change Info",
        component: () => import ("@/views/ChangeInfo.vue")
    }
]

const router = new VueRouter({
    mode: "history",
    base: process.env.BASE_URL,
    routes,
})

export default router
