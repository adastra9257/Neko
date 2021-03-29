import Vue from "vue"
import Vuex from "vuex"

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        // 登录用户信息
        uuid: "",
        login: "",
        name: "",
        password: "",
        hashedPassword: "",
        aesKey: {},
        pubKey: "",
        privKey: "",
    },
    mutations: {
        setUser(state, userInfo) {
            state.uuid = userInfo.uuid
            state.login = userInfo.login
            state.name = userInfo.name
            state.password = userInfo.password
            state.hashedPassword = userInfo.hashedPassword
            state.aesKey = userInfo.aesKey
            state.pubKey = userInfo.pubKey
            state.privKey = userInfo.privKey
        }
    },
    actions: {},
    modules: {},
})
