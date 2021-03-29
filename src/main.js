import "@babel/polyfill"
import "mutationobserver-shim"
import Vue from "vue"
import "./plugins/bootstrap-vue"
import peer from "@/plugins/peer"
import App from "./App.vue"
import router from "./router"
import store from "./store"
import { isAuthenticated } from "./utils/helper"
import moment from "moment"

Vue.config.productionTip = false

Vue.use(peer)

new Vue({
    router,
    store,
    render: (h) => h(App),
}).$mount("#app")

// 注册事件，没登陆就强制跳转到登陆页面
router.beforeEach((to, from, next) => {
    if (to.name !== "Login" && !isAuthenticated()) {
        next({ name: "Login" })
    } else {
        next()
    }
})

moment.locale('zh-cn')

