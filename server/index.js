const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const fs = require('fs')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

// 判断是否在pkg打包环境中运行
const isPkg = typeof process.pkg !== 'undefined'

// 静态文件路径 - pkg打包时使用快照路径
const distPath = isPkg
    ? path.join(__dirname, '../dist')
    : path.join(__dirname, '../dist')

// 数据文件路径 - pkg打包时使用可执行文件同级目录
const dataDir = isPkg
    ? path.join(path.dirname(process.execPath), 'data')
    : path.join(__dirname, 'data')
const DATA_FILE = path.join(dataDir, 'data.json')

// 中间件
app.use(express.json())
app.use(express.static(distPath))

// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
}

// 初始化数据文件
function initData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            users: [],
            winners: [],
            prizes: [
                { id: 1, name: '一等奖', desc: 'iPhone 15 Pro' },
                { id: 2, name: '二等奖', desc: 'AirPods Pro' },
                { id: 3, name: '三等奖', desc: '小米手环' },
                { id: 4, name: '幸运奖', desc: '精美礼品' }
            ],
            config: {
                theme: 'default',
                displayTitle: '2026年XXX公司年会'
            }
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2))
    }
}

// 读取数据
function readData() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf-8')
        return JSON.parse(content)
    } catch (e) {
        initData()
        return readData()
    }
}

// 写入数据
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// 初始化
initData()

// ============ API路由 ============

// 获取所有用户
app.get('/api/users', (req, res) => {
    const data = readData()
    res.json(data.users)
})

// 获取可抽奖用户（排除已中奖）
app.get('/api/users/available', (req, res) => {
    const data = readData()
    const winnerIds = data.winners.map(w => w.userId)
    const available = data.users.filter(u => !winnerIds.includes(u.id))
    res.json(available)
})

// 用户签到
app.post('/api/checkin', (req, res) => {
    const { phone, name } = req.body

    if (!phone || !name) {
        return res.status(400).json({ error: '请输入手机号和姓名' })
    }

    const data = readData()

    // 检查是否已签到
    const existing = data.users.find(u => u.phone === phone)
    if (existing) {
        return res.status(400).json({ error: '该手机号已签到', user: existing })
    }

    // 创建新用户
    const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phone: phone,
        phoneMask: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        name: name,
        time: new Date().toLocaleString('zh-CN')
    }

    data.users.push(user)
    writeData(data)

    // 广播新用户签到
    io.emit('user-checkin', user)

    res.json({ success: true, user })
})

// 获取奖品列表
app.get('/api/prizes', (req, res) => {
    const data = readData()
    res.json(data.prizes)
})

// 添加奖品
app.post('/api/prizes', (req, res) => {
    const { name, desc } = req.body

    if (!name) {
        return res.status(400).json({ error: '请输入奖品名称' })
    }

    const data = readData()
    const prize = {
        id: Date.now(),
        name,
        desc: desc || ''
    }

    data.prizes.push(prize)
    writeData(data)

    res.json({ success: true, prize })
})

// 删除奖品
app.delete('/api/prizes/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const data = readData()

    data.prizes = data.prizes.filter(p => p.id !== id)
    writeData(data)

    res.json({ success: true })
})

// 更新奖品
app.put('/api/prizes/:id', (req, res) => {
    const id = parseInt(req.params.id)
    const { name, desc } = req.body

    if (!name) {
        return res.status(400).json({ error: '请输入奖品名称' })
    }

    const data = readData()
    const prize = data.prizes.find(p => p.id === id)

    if (!prize) {
        return res.status(404).json({ error: '奖品不存在' })
    }

    prize.name = name
    prize.desc = desc || ''
    writeData(data)

    res.json({ success: true, prize })
})

// 获取中奖记录
app.get('/api/winners', (req, res) => {
    const data = readData()
    res.json(data.winners)
})

// 执行抽奖
app.post('/api/draw', (req, res) => {
    const { prizeId, count = 1 } = req.body

    const data = readData()

    // 获取奖品信息
    const prize = data.prizes.find(p => p.id === prizeId)
    if (!prize) {
        return res.status(400).json({ error: '请选择奖品' })
    }

    // 获取可抽奖用户
    const winnerIds = data.winners.map(w => w.userId)
    const available = data.users.filter(u => !winnerIds.includes(u.id))

    if (available.length === 0) {
        return res.status(400).json({ error: '没有可抽奖的用户' })
    }

    // 随机抽取
    const drawCount = Math.min(count, available.length)
    const winners = []
    const pool = [...available]

    for (let i = 0; i < drawCount; i++) {
        const index = Math.floor(Math.random() * pool.length)
        const winner = pool.splice(index, 1)[0]

        const winnerRecord = {
            id: `win_${Date.now()}_${i}`,
            userId: winner.id,
            userName: winner.name,
            userPhone: winner.phoneMask,
            prizeId: prize.id,
            prizeName: prize.name,
            prizeDesc: prize.desc,
            time: new Date().toLocaleString('zh-CN')
        }

        winners.push(winnerRecord)
        data.winners.push(winnerRecord)
    }

    writeData(data)

    // 广播抽奖结果
    io.emit('draw-result', { prize, winners })

    res.json({ success: true, winners })
})

// 重置数据
app.post('/api/reset', (req, res) => {
    const data = readData()
    data.users = []
    data.winners = []
    writeData(data)

    io.emit('data-reset')

    res.json({ success: true })
})

// 获取配置
app.get('/api/config', (req, res) => {
    const data = readData()
    // 确保config存在
    if (!data.config) {
        data.config = {
            theme: 'default',
            displayTitle: '2026年XXX公司年会'
        }
        writeData(data)
    }
    res.json(data.config)
})

// 更新配置
app.put('/api/config', (req, res) => {
    const { theme, displayTitle } = req.body
    const data = readData()

    if (!data.config) {
        data.config = {}
    }

    if (theme !== undefined) {
        data.config.theme = theme
    }
    if (displayTitle !== undefined) {
        data.config.displayTitle = displayTitle
    }

    writeData(data)

    // 广播配置更新
    io.emit('config-update', data.config)

    res.json({ success: true, config: data.config })
})

// ============ WebSocket ============

io.on('connection', (socket) => {
    console.log('客户端已连接:', socket.id)

    // 开始抽奖动画
    socket.on('draw-start', (data) => {
        io.emit('draw-start', data)
    })

    // 停止抽奖
    socket.on('draw-stop', () => {
        io.emit('draw-stop')
    })

    socket.on('disconnect', () => {
        console.log('客户端已断开:', socket.id)
    })
})

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
})

// 启动服务器
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║       🎉 幸运抽奖系统已启动 🎉              ║
╠═══════════════════════════════════════════╣
║  访问地址:                                  ║
║  - 签到页面: http://localhost:${PORT}         ║
║  - 管理后台: http://localhost:${PORT}/#/admin  ║
║  - 抽奖大屏: http://localhost:${PORT}/#/display║
╚═══════════════════════════════════════════╝
  `)
})
