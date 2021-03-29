import forge from "node-forge"
import { v4 as uuidv4 } from "uuid"
import alasql from "alasql"
import moment from "moment"

export function empty(obj) {
    if (obj) {
        return false
    } else {
        return true
    }
}

export function storageAvailable(type) {
    let storage
    try {
        storage = window[type]
        let x = "__storage_test__"
        storage.setItem(x, x)
        storage.removeItem(x)
        return true
    } catch (e) {
        return (
            e instanceof DOMException &&
            // everything except Firefox
            (e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
            // acknowledge QuotaExceededError only if there's something already stored
            storage &&
            storage.length !== 0
        )
    }
}

export function debug(obj) {
    if (process.env.VUE_APP_DEBUG_ON == "true") console.log(obj)
}

export function hashPassword(password, salt) {
    debug("Hashing password...")
    debug(`Password: ${password}`)
    debug(`Salt: ${salt}`)
    let md = forge.md.sha1.create()
    md.update(password)
    md.update(salt)
    let hashedPassword = md.digest().toHex()
    debug(`Hashed password: ${hashedPassword}`)
    return hashedPassword
}

export function verifyPassword(password, salt, hashedPassword) {
    debug("Veryfing password...")
    debug(`Salt: ${salt}`)
    debug(`Password: ${password}`)
    debug(`Hashed password: ${hashedPassword}`)
    let passwordInput = hashPassword(password, salt)
    return passwordInput == hashedPassword
}

export function genPassword() {
    return forge.random.getBytesSync(16)
}

// Convert password to 64-bit string
export function pwd2AesKey(password) {
    debug(`Real password: ${password}`)
    let md = forge.md.sha256.create()
    md.update(password)
    let pwd = md.digest().toHex()
    debug(`Used password: ${pwd}`)
    // Generate AES key from password
    let aesKey = {
        key: pwd.slice(0, pwd.length / 2),
        iv: pwd.slice(pwd.length / 2, pwd.length),
    }
    debug(`Key: ${aesKey.key}`)
    debug(`iv: ${aesKey.iv}`)
    return aesKey
}

export function aesEncrypt(rawString, aesKey) {
    // URIComponent编码，防止解码时中文乱码
    let string = encodeURIComponent(rawString)
    // 实例化加密流
    let cipher = forge.cipher.createCipher("AES-CFB", aesKey.key)
    cipher.start({ iv: aesKey.iv })
    cipher.update(forge.util.createBuffer(string))
    cipher.finish()
    // 加密完成，提取结果
    let encrypted = cipher.output
    let encStr = encrypted.getBytes()
    // Base64编码，防止密文出现特殊符号导致其余功能报错
    let baseEncStr = btoa(encStr)
    return baseEncStr
}

export function aesDecrypt(baseEncStr, aesKey) {
    // Base64解码
    let encStr = atob(baseEncStr)
    // 实例化解密流
    let decipher = forge.cipher.createDecipher("AES-CFB", aesKey.key)
    decipher.start({ iv: aesKey.iv })
    decipher.update(forge.util.createBuffer(encStr))
    // 解密完成，提取结果
    let decrypted = decipher.output
    let string = decrypted.getBytes()
    // URIComponent解码
    let rawString = decodeURIComponent(string)
    return rawString
}

export function genRsaKeyPair() {
    let rsa = forge.pki.rsa
    let keypair = rsa.generateKeyPair({ bits: 2048, e: 0x10001 })
    return keypair
}

export function exportRsaKeyPair(keypair) {
    return JSON.stringify({
        publicKeyPem: forge.pki.publicKeyToPem(keypair.publicKey),
        privateKeyPem: forge.pki.privateKeyToPem(keypair.privateKey),
    })
}

export function importRsaKeyPair(keypair) {
    let keypairPem = JSON.parse(keypair)
    return {
        publicKey: forge.pki.publicKeyFromPem(keypairPem.publicKeyPem),
        privateKey: forge.pki.privateKeyFromPem(keypairPem.privateKeyPem),
    }
}

export function initialize() {
    if (!storageAvailable("localStorage")) {
        return
    }

    // Connect to AlaSQL / 连接本地 AlaSQL
    alasql("CREATE localStorage DATABASE IF NOT EXISTS Neko")
    try {
        alasql("ATTACH localStorage DATABASE Neko AS Neko")
    } catch (error) {
        debug(error)
    }

    // Create Table / 建表
    alasql(
        "CREATE TABLE IF NOT EXISTS Neko.profile (uuid, login, name, hashedPassword, pubKey, privKey, pubKeyMd5, PRIMARY KEY (uuid))"
    )
    alasql(
        "CREATE TABLE IF NOT EXISTS Neko.contact (uuid, name, pubKeyMd5, lastMessage, lastChatTime, PRIMARY KEY (uuid))"
    )
    alasql(
        "CREATE TABLE IF NOT EXISTS Neko.chatRecord (uuid, datetime, content, isSender, PRIMARY KEY (uuid, datetime))"
    )

    // Create Basic Profile / 新建基础档案
    let profileCount = alasql("SELECT COUNT(uuid) FROM Neko.profile")
    if (profileCount[0]["COUNT(uuid)"] == 0) {
        // 新建默认档案 user:123456
        let uuid = uuidv4()
        let login = "user"
        let name = "Anonymous"
        let hashedPassword = hashPassword("123456", uuid)
        let rsa = forge.pki.rsa
        let keypair = rsa.generateKeyPair({ bits: 2048, e: 0x10001 })
        let pubKeyRaw = forge.pki.publicKeyToPem(keypair.publicKey)
        let privKeyRaw = forge.pki.privateKeyToPem(keypair.privateKey)
        let aesKey = pwd2AesKey("123456")
        let pubKey = aesEncrypt(pubKeyRaw, aesKey)
        let privKey = aesEncrypt(privKeyRaw, aesKey)
        let md = forge.md.md5.create()
        md.update(pubKeyRaw)
        let pubKeyMd5 = md.digest().toHex()
        alasql(`INSERT INTO Neko.profile VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            uuid,
            login,
            name,
            hashedPassword,
            pubKey,
            privKey,
            pubKeyMd5
        ])
    }
}

export function isAuthenticated() {
    // 检测 Local Storage 是否有用户信息，有的话读入 Session Storage
    let localUser = localStorage.getItem("currentUserInfo")
    if (!empty(localUser)) {
        sessionStorage.setItem("currentUserInfo", localUser)
    }
    // 检测 Session Storage 是否有用户信息
    let sessionUser = sessionStorage.getItem("currentUserInfo")
    if (!empty(sessionUser)) {
        return true
    } else {
        return false
    }
}

export function logIn(user, remember) {
    if (remember) {
        localStorage.setItem("currentUserInfo", JSON.stringify(user))
    }
    sessionStorage.setItem("currentUserInfo", JSON.stringify(user))
}

export function logOut() {
    localStorage.removeItem("currentUserInfo")
    sessionStorage.removeItem("currentUserInfo")
}

export function getTimeNow() {
    return moment().format("YYYY-MM-DD HH:mm:ss:SSS")
}
export function getTimeNowDiffText(datetime) {
    return moment(datetime, "YYYY-MM-DD HH:mm:ss:SSS").fromNow()
}