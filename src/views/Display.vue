<template>
  <div class="display-page">
    <!-- 粒子背景 -->
    <div class="particles">
      <div v-for="i in 80" :key="i" class="particle" :style="particleStyle(i)"></div>
    </div>
    
    <!-- 烟花效果（中奖时） -->
    <div class="fireworks" v-if="showFireworks">
      <div v-for="i in 30" :key="'fw'+i" class="firework" :style="fireworkStyle(i)"></div>
    </div>
    
    <!-- 主标题 -->
    <header class="display-header">
      <div class="event-title">{{ displayTitle }}</div>
      <h1 class="title-lg animate-float">🎉 幸运抽奖 🎉</h1>
      <p class="subtitle" v-if="currentPrize">正在抽取：{{ currentPrize.name }}</p>
    </header>
    
    <!-- 抽奖展示区 -->
    <main class="display-main">
      <!-- 等待状态 -->
      <div v-if="status === 'waiting'" class="waiting-box">
        <div class="waiting-icon animate-pulse">🎰</div>
        <p>等待抽奖开始...</p>
        <div class="user-count">
          已签到 <span>{{ userCount }}</span> 人
        </div>
      </div>
      
      <!-- 抽奖中 -->
      <div v-else-if="status === 'drawing'" class="drawing-box">
        <div class="prize-name">{{ currentPrize?.name }}</div>
        <div class="rolling-display">
          <div class="rolling-name" :class="{ rolling: true }">
            {{ rollingName }}
          </div>
        </div>
      </div>
      
      <!-- 中奖结果 -->
      <div v-else-if="status === 'result'" class="result-box animate-slideUp">
        <div class="result-title">🎊 恭喜中奖 🎊</div>
        <div class="result-prize">{{ currentPrize?.name }}</div>
        <div class="result-winners">
          <div v-for="w in currentWinners" :key="w.id" class="result-winner-card">
            <div class="winner-name">{{ w.userName }}</div>
            <div class="winner-phone">{{ w.userPhone }}</div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- 底部状态栏 -->
    <footer class="display-footer glass-card">
      <div class="footer-stat">
        <span class="label">签到人数</span>
        <span class="value">{{ userCount }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">已中奖</span>
        <span class="value">{{ winnerCount }}</span>
      </div>
      <div class="footer-stat">
        <span class="label">剩余名额</span>
        <span class="value">{{ userCount - winnerCount }}</span>
      </div>
    </footer>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  name: 'Display',
  
  data() {
    return {
      status: 'waiting', // waiting, drawing, result
      userCount: 0,
      winnerCount: 0,
      currentPrize: null,
      currentWinners: [],
      rollingName: '?',
      showFireworks: false,
      socket: null,
      users: [],
      drawInterval: null,
      displayTitle: '2026年XXX公司年会'
    }
  },
  
  created() {
    this.fetchData()
    this.initSocket()
  },
  
  beforeDestroy() {
    if (this.socket) this.socket.disconnect()
    if (this.drawInterval) clearInterval(this.drawInterval)
  },
  
  methods: {
    async fetchData() {
      try {
        const [usersRes, winnersRes, configRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/winners'),
          fetch('/api/config')
        ])
        
        this.users = await usersRes.json()
        const winners = await winnersRes.json()
        const config = await configRes.json()
        
        this.userCount = this.users.length
        this.winnerCount = winners.length
        this.displayTitle = config.displayTitle || '2026年XXX公司年会'
        this.applyTheme(config.theme || 'default')
      } catch (e) {
        console.error(e)
      }
    },
    
    initSocket() {
      this.socket = io()
      
      // 新用户签到
      this.socket.on('user-checkin', (user) => {
        this.users.push(user)
        this.userCount++
      })
      
      // 开始抽奖
      this.socket.on('draw-start', (data) => {
        this.status = 'drawing'
        this.currentPrize = data.prize
        this.currentWinners = []
        this.showFireworks = false
        
        // 开始滚动
        this.drawInterval = setInterval(() => {
          const availableUsers = this.getAvailableUsers()
          if (availableUsers.length > 0) {
            const idx = Math.floor(Math.random() * availableUsers.length)
            this.rollingName = availableUsers[idx].name
          }
        }, 50)
      })
      
      // 抽奖结果
      this.socket.on('draw-result', (data) => {
        clearInterval(this.drawInterval)
        
        this.currentPrize = data.prize
        this.currentWinners = data.winners
        this.winnerCount += data.winners.length
        this.status = 'result'
        
        // 显示烟花
        this.showFireworks = true
        
        // 5秒后回到等待状态
        setTimeout(() => {
          this.status = 'waiting'
          this.showFireworks = false
        }, 8000)
      })
      
      // 停止抽奖
      this.socket.on('draw-stop', () => {
        clearInterval(this.drawInterval)
      })
      
      // 数据重置
      this.socket.on('data-reset', () => {
        this.users = []
        this.userCount = 0
        this.winnerCount = 0
        this.status = 'waiting'
      })
      
      // 配置更新
      this.socket.on('config-update', (config) => {
        if (config.displayTitle) {
          this.displayTitle = config.displayTitle
        }
        if (config.theme) {
          this.applyTheme(config.theme)
        }
      })
    },
    
    getAvailableUsers() {
      // 简单处理，实际应从服务器获取
      return this.users
    },
    
    particleStyle(i) {
      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 4}s`,
        width: `${4 + Math.random() * 4}px`,
        height: `${4 + Math.random() * 4}px`
      }
    },
    
    fireworkStyle(i) {
      const colors = ['#ff416c', '#ffd700', '#4ade80', '#60a5fa', '#f472b6']
      return {
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 60}%`,
        background: colors[i % colors.length],
        animationDelay: `${Math.random() * 0.5}s`
      }
    },
    
    applyTheme(theme) {
      if (theme === 'red') {
        document.documentElement.setAttribute('data-theme', 'red')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  }
}
</script>

<style scoped>
.display-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

/* 粒子背景 */
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  background: rgba(255, 215, 0, 0.5);
  border-radius: 50%;
  animation: floatParticle 5s ease-in-out infinite;
}

@keyframes floatParticle {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-40px) scale(1.3);
    opacity: 1;
  }
}

/* 烟花效果 */
.fireworks {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.firework {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: explode 1s ease-out forwards;
}

@keyframes explode {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(3);
    opacity: 1;
  }
  100% {
    transform: scale(5);
    opacity: 0;
  }
}

/* 头部 */
.display-header {
  text-align: center;
  z-index: 1;
}

.event-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 15px;
  letter-spacing: 4px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
}

.subtitle {
  font-size: 24px;
  color: var(--accent-color);
  margin-top: 10px;
}

/* 主内容 */
.display-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  width: 100%;
}

/* 等待状态 */
.waiting-box {
  text-align: center;
}

.waiting-icon {
  font-size: 120px;
  margin-bottom: 20px;
}

.waiting-box p {
  font-size: 28px;
  color: var(--text-secondary);
}

.user-count {
  margin-top: 30px;
  font-size: 24px;
  color: var(--text-muted);
}

.user-count span {
  font-size: 48px;
  font-weight: 700;
  color: var(--accent-color);
  margin: 0 10px;
}

/* 抽奖中 */
.drawing-box {
  text-align: center;
}

.prize-name {
  font-size: 36px;
  color: var(--accent-color);
  margin-bottom: 40px;
}

.rolling-display {
  width: 500px;
  height: 180px;
  background: rgba(0,0,0,0.4);
  border: 3px solid var(--accent-color);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 60px rgba(255, 215, 0, 0.3);
}

.rolling-name {
  font-size: 80px;
  font-weight: 700;
  color: #fff;
}

.rolling-name.rolling {
  animation: flash 0.1s infinite;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 中奖结果 */
.result-box {
  text-align: center;
}

.result-title {
  font-size: 48px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #ffd700, #ff416c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-prize {
  font-size: 32px;
  color: var(--accent-color);
  margin-bottom: 40px;
}

.result-winners {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.result-winner-card {
  padding: 40px 60px;
  background: var(--gold-gradient);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
  animation: bounceIn 0.6s ease;
}

.result-winner-card .winner-name {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 10px;
}

.result-winner-card .winner-phone {
  font-size: 24px;
  opacity: 0.9;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 底部 */
.display-footer {
  display: flex;
  gap: 60px;
  padding: 20px 60px;
  z-index: 1;
}

.footer-stat {
  text-align: center;
}

.footer-stat .label {
  display: block;
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.footer-stat .value {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff416c, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 响应式 */
@media (max-width: 768px) {
  .rolling-display {
    width: 90vw;
    height: 120px;
  }
  
  .rolling-name {
    font-size: 48px;
  }
  
  .result-winner-card {
    padding: 30px 40px;
  }
  
  .result-winner-card .winner-name {
    font-size: 32px;
  }
}
</style>
