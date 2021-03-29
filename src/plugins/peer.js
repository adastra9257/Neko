import alasql from "alasql"
import Peer from "peerjs"
import forge from "node-forge"
import { EventBus } from "./event-bus.js"
import {
    debug,
    genPassword,
    aesEncrypt,
    aesDecrypt,
    getTimeNow,
} from "@/utils/helper"

// const host = "192.168.32.129"
const host = "139.196.17.6"
const peerPort = 9000
const turnPort = 3478

export default {
    install(Vue) {
        Vue.prototype.$peer = {
            peer: {},
            conn: {},
            userInfo: {},
            // 服务器信息
            serverCred: {
                host: host,
                port: peerPort,
                path: "/myapp",
                config: {
                    iceServers: [
                        {
                            urls: `turn:${host}:${turnPort}`,
                            username: "guest",
                            credential: "123456",
                        },
                    ],
                },
            },
            peerInit: function(userInfo) {
                // 注册个人信息
                this.userInfo = userInfo
                const app = this
                // 初始化 Peer 并连接服务器
                this.peer = new Peer(this.userInfo.uuid, this.serverCred)
                // 注册监听事件
                this.peer.on("connection", function(newConn) {
                    // 收到连接的场合，以对方的ID为标记
                    let label = newConn.metadata.sender
                    app.conn[label] = newConn
                    app.connInit(label, false)
                    debug("Receive Connection")
                })
                debug("Create Peer")
            },
            peerDestroy: function() {
                this.peer.destroy()
                this.peer = {}
            },
            connect: function(targetUuid) {
                // 连接指定对象
                let newConn = this.peer.connect(targetUuid, {
                    metadata: {
                        sender: this.userInfo.uuid,
                        senderName: this.userInfo.name,
                        receiver: targetUuid,
                    },
                })
                debug("Generate Connection")
                debug("newConn:")
                debug(newConn)
                // 更新连接
                this.connRefresh(targetUuid, newConn)
                debug("Refresh Connection")
                debug(`conn[${targetUuid}]:`)
                debug(this.conn[targetUuid])
                // 注册连接
                this.connInit(targetUuid, true)
                debug("Create Connection")
            },
            connInit: function(label, isSender) {
                let app = this
                let conn = this.conn[label]
                let myPubKey = aesDecrypt(
                    this.userInfo.pubKey,
                    this.userInfo.aesKey
                )
                let myPrivKey = aesDecrypt(
                    this.userInfo.privKey,
                    this.userInfo.aesKey
                )
                conn.on("open", function() {
                    debug("Connection Open")
                    // 启动密钥交换
                    if (isSender) {
                        conn.send({ pubKey: myPubKey })
                    }
                    // 注册收信事件
                    conn.on("data", function(res) {
                        debug("Received:")
                        debug(res)
                        // 判断收到的数据是否符合密钥规范
                        if (res.pubKey) {
                            // RSA证书规范：回传本会话专用的AES密钥
                            // 生成证书MD5，与已知的MD5比对；没有匹配的话，提醒用户进行验证
                            let confirm = app.confirmPubKey(label, res.pubKey)
                            if (confirm.result) {
                                if (confirm.newUser) {
                                    // 添加新联系人
                                    alasql(
                                        "INSERT INTO Neko.contact VALUES (?, ?, ?, ?, ?)",
                                        [
                                            label,
                                            conn.metadata.senderName,
                                            confirm.pubKeyMd5,
                                            "",
                                            getTimeNow(),
                                        ]
                                    )
                                } else if (confirm.changedUser) {
                                    // 更新已知联系人
                                    alasql(
                                        "UPDATE Neko.contact SET pubKeyMd5 = ? WHERE uuid = ?",
                                        [confirm.pubKeyMd5, label]
                                    )
                                }
                                // 更新已知联系人
                                alasql(
                                    "UPDATE Neko.contact SET name = ? WHERE uuid = ?",
                                    [conn.metadata.senderName, label]
                                )
                                app.sendAesKey(conn, res.pubKey, myPubKey)
                            } else {
                                // 拒绝连接
                            }
                        } else if (res.aesKey) {
                            // AES密钥规范：登记密钥
                            let confirm = app.confirmPubKey(label, res.pubKey2)
                            if (confirm.result) {
                                if (confirm.changedUser) {
                                    alasql(
                                        "UPDATE Neko.contact SET pubKeyMd5 = ? WHERE uuid = ?",
                                        [confirm.pubKeyMd5, label]
                                    )
                                }
                                let privKey = forge.pki.privateKeyFromPem(myPrivKey)
                                let aesKeyJson = privKey.decrypt(res.aesKey)
                                let aesKey = JSON.parse(aesKeyJson)
                                conn.aesKey = aesKey
                                alasql(
                                    "UPDATE Neko.contact SET name = ?, lastChatTime = ? WHERE uuid = ?",
                                    [res.name, getTimeNow, label]
                                )
                                conn.send({ result: "true" })
                                EventBus.$emit("connected", {})
                            } else {
                                // 拒绝连接
                            }
                        } else if (res.result && res.result == "true") {
                            EventBus.$emit("connected", {})
                        } else if (res.message) {
                            // 消息：解密并输出
                            let msg = aesDecrypt(res.message, conn.aesKey)
                            let datetime = res.datetime
                            // 写入聊天记录
                            app.addChatRecord(label, datetime, msg, false)
                        }
                    })
                })
            },
            connRefresh: function(targetUuid, newConn) {
                this.conn[targetUuid] = {}
                this.conn[targetUuid] = newConn
            },
            confirmPubKey(uuid, pubKeyPem) {
                let confirmed = true
                let md = forge.md.md5.create()
                md.update(pubKeyPem)
                let pubKeyMd5 = md.digest().toHex()
                let uuidQuery = alasql(
                    "SELECT * FROM Neko.contact WHERE uuid = ?",
                    [uuid]
                )
                let uuidCount = uuidQuery.length
                let newUser = uuidCount <= 0 ? true : false
                let changedUser = newUser
                    ? false
                    : uuidQuery[0].pubKeyMd5 != pubKeyMd5
                    ? true
                    : false
                if (newUser || changedUser) {
                    // 新用户请求 或 已知用户公钥变动
                    confirmed = confirm(
                        `UUID：${uuid}，密钥：${pubKeyMd5}，请求连接，确认？`
                    )
                }
                return {
                    newUser: newUser,
                    changedUser: changedUser,
                    result: confirmed,
                    pubKeyMd5: pubKeyMd5
                }
            },
            send: function(targetUuid, message) {
                if (this.conn[targetUuid]) {
                    // 如果连接存在则发送
                    let conn = this.conn[targetUuid]
                    let encMsg = aesEncrypt(message, conn.aesKey)
                    let datetime = getTimeNow()
                    let payload = {
                        message: encMsg,
                        datetime: datetime,
                    }
                    conn.send(payload)
                    debug("Sending: ")
                    debug(payload)
                    this.addChatRecord(targetUuid, datetime, message, true)
                } else {
                    // 连接不存在
                }
            },
            sendAesKey: function(conn, pubKeyPem, myPubKeyPem) {
                let pubKey = forge.pki.publicKeyFromPem(pubKeyPem)
                let aesKey = {
                    key: genPassword(),
                    iv: genPassword(),
                }
                conn.aesKey = aesKey
                let aesKeyJson = JSON.stringify(aesKey)
                let encAesKey = pubKey.encrypt(aesKeyJson)
                conn.send({
                    name: this.userInfo.name,
                    aesKey: encAesKey,
                    pubKey2: myPubKeyPem,
                })
                debug("AES Key Sended")
            },
            addChatRecord: function(uuid, datetime, content, isSender) {
                // 要想办法通知Vue有新的消息
                debug("Add new content to chat record:")
                debug(uuid)
                debug(datetime)
                debug(content)
                let encMsg = aesEncrypt(content, this.userInfo.aesKey)
                let query = `INSERT INTO Neko.chatRecord VALUES ("${uuid}", "${datetime}", '${encMsg}', '${isSender}')`
                alasql(query)
                alasql(
                    "UPDATE Neko.contact SET lastMessage = ?, lastChatTime = ? WHERE uuid = ?",
                    [encMsg, datetime, uuid]
                )
                EventBus.$emit("connected", {})
                EventBus.$emit("new-content", {
                    uuid: uuid,
                    datetime: datetime,
                    content: content,
                    isSender: isSender,
                })
            },
        }
    },
}
