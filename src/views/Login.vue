<template>
    <div class="container" style="margin-top: 5rem;">
        <div class="form-group">
            <label for="login">用户名</label>
            <input
                class="form-control"
                id="login"
                aria-describedby="defaultLogin"
                v-model="login"
            />
            <small id="defaultLogin" class="form-text text-muted"
                >默认用户名：user</small
            >
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
            <small id="defaultPassword" class="form-text text-muted"
                >默认密码：123456</small
            >
        </div>
        <div class="form-group form-check">
            <input
                type="checkbox"
                class="form-check-input"
                id="remember"
                v-model="remember"
            />
            <label class="form-check-label" for="remember">保持登录</label>
        </div>
        <button class="btn btn-primary" @click="loginAction">登录</button>
    </div>
</template>

<script>
import alasql from "alasql"
import {
    debug,
    hashPassword,
    verifyPassword,
    pwd2AesKey,
    isAuthenticated,
    logIn,
} from "../utils/helper"

export default {
    name: "Login",
    data() {
        return {
            login: "",
            password: "",
            remember: false,
        }
    },
    mounted() {
        // 验证是否登录，已经登录则进入首页
        if (isAuthenticated()) {
            this.$router.replace({ name: "Contacts" })
        }
    },
    methods: {
        verifyPassword(password, salt, hashedPassword) {
            debug("Veryfing password...")
            debug(`Salt: ${salt}`)
            debug(`Password: ${password}`)
            debug(`Hashed password: ${hashedPassword}`)
            let passwordInput = hashPassword(password, salt)
            return passwordInput == hashedPassword
        },
        loginAction() {
            // 找到对应用户名的信息
            let profile = alasql(`SELECT * FROM Neko.profile WHERE login = ?`, [
                this.login,
            ])
            if (profile.length == 0) {
                alert("找不到用户名")
                return false
            } else if (
                // 验证密码是否匹配
                !verifyPassword(
                    this.password,
                    profile[0].uuid,
                    profile[0].hashedPassword
                )
            ) {
                alert("密码错误")
                return false
            } else {
                // 密码匹配，记录信息
                let user = profile[0]
                user.aesKey = pwd2AesKey(this.password)
                logIn(user, this.remember)
                // 初始化 Peer
                this.$peer.peerInit(user)
                // 刷新主页
                this.$router.replace({ name: "Contacts" })
            }
        },
    },
}
</script>
