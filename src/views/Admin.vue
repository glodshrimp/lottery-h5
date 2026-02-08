<template>
  <div class="admin-page">
    <!-- 头部 -->
    <header class="header glass-card">
      <h1>🎰 抽奖管理后台</h1>
      <div class="header-stats">
        <span>签到: {{ users.length }}</span>
        <span>已抽: {{ winners.length }}</span>
        <span>剩余: {{ availableUsers.length }}</span>
      </div>
    </header>
    
    <div class="main-content">
      <!-- 左侧：用户列表 -->
      <aside class="sidebar glass-card">
        <h3>📋 签到用户 ({{ users.length }})</h3>
        <div class="user-list">
          <div 
            v-for="user in users" 
            :key="user.id" 
            class="user-item"
            :class="{ 'is-winner': isWinner(user.id) }"
          >
            <span class="user-name">{{ user.name }}</span>
            <span class="user-phone">{{ user.phoneMask }}</span>
            <span v-if="isWinner(user.id)" class="winner-badge">🏆</span>
          </div>
          <div v-if="users.length === 0" class="empty">暂无签到用户</div>
        </div>
      </aside>
      
      <!-- 中间：抽奖区 -->
      <main class="lottery-area">
        <!-- 奖品选择 -->
        <div class="prize-selector glass-card">
          <div class="prize-header">
            <h3>🎁 选择奖品</h3>
            <button class="btn-add-prize" @click="openPrizeModal()">+ 添加奖品</button>
          </div>
          <div class="prize-list">
            <div 
              v-for="prize in prizes" 
              :key="prize.id"
              class="prize-item"
              :class="{ active: selectedPrize?.id === prize.id }"
              @click="selectedPrize = prize"
            >
              <div class="prize-info">
                <span class="prize-name">{{ prize.name }}</span>
                <small>{{ prize.desc }}</small>
              </div>
              <div class="prize-actions" @click.stop>
                <button class="btn-icon" @click="openPrizeModal(prize)" title="编辑">✏️</button>
                <button class="btn-icon btn-delete" @click="deletePrize(prize)" title="删除">🗑️</button>
              </div>
            </div>
            <div v-if="prizes.length === 0" class="empty-prize">暂无奖品，请添加</div>
          </div>
        </div>
        
        <!-- 抽奖动画区 -->
        <div class="draw-box glass-card">
          <div class="draw-display">
            <div class="rolling-name" :class="{ rolling: isDrawing }">
              {{ displayName }}
            </div>
          </div>
          
          <!-- 抽奖按钮 -->
          <div class="draw-actions">
            <button 
              v-if="!isDrawing" 
              class="btn-primary btn-gold btn-large"
              @click="startDraw"
              :disabled="!selectedPrize || availableUsers.length === 0"
            >
              开始抽奖
            </button>
            <button 
              v-else 
              class="btn-primary btn-large"
              @click="stopDraw"
            >
              停止
            </button>
          </div>
          
          <div class="draw-count">
            <label>抽取人数：</label>
            <input type="number" v-model.number="drawCount" min="1" max="10" />
          </div>
        </div>
        
        <!-- 本轮中奖 -->
        <div v-if="currentWinners.length > 0" class="current-winners glass-card animate-slideUp">
          <h3>🎊 恭喜中奖</h3>
          <div class="winner-cards">
            <div v-for="w in currentWinners" :key="w.id" class="winner-card">
              <div class="winner-name">{{ w.userName }}</div>
              <div class="winner-prize">{{ w.prizeName }}</div>
            </div>
          </div>
        </div>
      </main>
      
      <!-- 右侧：中奖名单 -->
      <aside class="sidebar glass-card">
        <h3>🏆 中奖名单 ({{ winners.length }})</h3>
        <div class="winner-list">
          <div v-for="winner in winners" :key="winner.id" class="winner-item">
            <span class="winner-name">{{ winner.userName }}</span>
            <span class="winner-prize-tag">{{ winner.prizeName }}</span>
          </div>
          <div v-if="winners.length === 0" class="empty">暂无中奖记录</div>
        </div>
        
        <!-- 配置设置 -->
        <div class="config-section">
          <h4>⚙️ 显示设置</h4>
          
          <!-- 主题切换 -->
          <div class="config-item">
            <label>主题风格</label>
            <div class="theme-switcher">
              <button 
                class="theme-btn" 
                :class="{ active: currentTheme === 'default' }"
                @click="setTheme('default')"
              >
                🌙 紫蓝
              </button>
              <button 
                class="theme-btn theme-red" 
                :class="{ active: currentTheme === 'red' }"
                @click="setTheme('red')"
              >
                🔴 红色
              </button>
            </div>
          </div>
          
          <!-- 大屏标题 -->
          <div class="config-item">
            <label>大屏标题</label>
            <input 
              type="text" 
              v-model="displayTitle" 
              placeholder="2026年XXX公司年会"
              class="input-sm"
              @blur="saveConfig"
              @keyup.enter="saveConfig"
            />
          </div>
        </div>
        
        <!-- 重置按钮 -->
        <button class="btn-reset" @click="handleReset">
          清空数据
        </button>
      </aside>
    </div>
    
    <!-- 奖品编辑弹窗 -->
    <div class="modal-overlay" v-if="showPrizeModal" @click="closePrizeModal">
      <div class="modal glass-card" @click.stop>
        <h3>{{ editingPrize ? '编辑奖品' : '添加奖品' }}</h3>
        <div class="form-group">
          <label>奖品名称</label>
          <input type="text" v-model="prizeForm.name" placeholder="如：一等奖" class="input-field" />
        </div>
        <div class="form-group">
          <label>奖品描述</label>
          <input type="text" v-model="prizeForm.desc" placeholder="如：iPhone 15 Pro" class="input-field" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closePrizeModal">取消</button>
          <button class="btn-primary" @click="savePrize">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 提示 -->
    <div class="toast" v-if="toastMsg">{{ toastMsg }}</div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  name: 'Admin',
  
  data() {
    return {
      users: [],
      winners: [],
      prizes: [],
      selectedPrize: null,
      drawCount: 1,
      isDrawing: false,
      displayName: '?',
      currentWinners: [],
      toastMsg: '',
      socket: null,
      drawInterval: null,
      // 奖品管理
      showPrizeModal: false,
      editingPrize: null,
      prizeForm: {
        name: '',
        desc: ''
      },
      // 配置设置
      currentTheme: 'default',
      displayTitle: '2026年XXX公司年会'
    }
  },
  
  computed: {
    availableUsers() {
      const winnerIds = this.winners.map(w => w.userId)
      return this.users.filter(u => !winnerIds.includes(u.id))
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
        const [usersRes, winnersRes, prizesRes, configRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/winners'),
          fetch('/api/prizes'),
          fetch('/api/config')
        ])
        
        this.users = await usersRes.json()
        this.winners = await winnersRes.json()
        this.prizes = await prizesRes.json()
        
        const config = await configRes.json()
        this.currentTheme = config.theme || 'default'
        this.displayTitle = config.displayTitle || '2026年XXX公司年会'
        this.applyTheme(this.currentTheme)
        
        if (this.prizes.length > 0) {
          this.selectedPrize = this.prizes[0]
        }
      } catch (e) {
        this.showToast('数据加载失败')
      }
    },
    
    initSocket() {
      this.socket = io()
      
      this.socket.on('user-checkin', (user) => {
        this.users.push(user)
        this.showToast(`${user.name} 已签到`)
      })
      
      this.socket.on('data-reset', () => {
        this.users = []
        this.winners = []
        this.currentWinners = []
      })
    },
    
    isWinner(userId) {
      return this.winners.some(w => w.userId === userId)
    },
    
    startDraw() {
      if (this.availableUsers.length === 0) {
        this.showToast('没有可抽奖的用户')
        return
      }
      
      this.isDrawing = true
      this.currentWinners = []
      
      // 广播开始抽奖
      this.socket.emit('draw-start', { prize: this.selectedPrize })
      
      // 开始滚动动画
      this.drawInterval = setInterval(() => {
        const idx = Math.floor(Math.random() * this.availableUsers.length)
        this.displayName = this.availableUsers[idx]?.name || '?'
      }, 50)
    },
    
    async stopDraw() {
      // 停止动画
      clearInterval(this.drawInterval)
      this.drawInterval = null
      
      // 调用抽奖API
      try {
        const res = await fetch('/api/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prizeId: this.selectedPrize.id,
            count: this.drawCount
          })
        })
        
        const data = await res.json()
        
        if (!res.ok) {
          this.showToast(data.error)
          this.isDrawing = false
          this.displayName = '?'
          return
        }
        
        // 显示中奖结果
        this.currentWinners = data.winners
        this.winners.push(...data.winners)
        
        if (data.winners.length === 1) {
          this.displayName = data.winners[0].userName
        } else {
          this.displayName = `${data.winners.length}人中奖`
        }
        
      } catch (e) {
        this.showToast('抽奖失败')
      }
      
      this.isDrawing = false
      this.socket.emit('draw-stop')
    },
    
    async handleReset() {
      if (!confirm('确定要清空所有数据吗？')) return
      
      try {
        await fetch('/api/reset', { method: 'POST' })
        this.users = []
        this.winners = []
        this.currentWinners = []
        this.displayName = '?'
        this.showToast('数据已清空')
      } catch (e) {
        this.showToast('操作失败')
      }
    },
    
    showToast(msg) {
      this.toastMsg = msg
      setTimeout(() => { this.toastMsg = '' }, 2000)
    },
    
    // 奖品管理方法
    openPrizeModal(prize = null) {
      this.editingPrize = prize
      if (prize) {
        this.prizeForm = { name: prize.name, desc: prize.desc }
      } else {
        this.prizeForm = { name: '', desc: '' }
      }
      this.showPrizeModal = true
    },
    
    closePrizeModal() {
      this.showPrizeModal = false
      this.editingPrize = null
      this.prizeForm = { name: '', desc: '' }
    },
    
    async savePrize() {
      if (!this.prizeForm.name.trim()) {
        this.showToast('请输入奖品名称')
        return
      }
      
      try {
        if (this.editingPrize) {
          // 编辑现有奖品
          const res = await fetch(`/api/prizes/${this.editingPrize.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.prizeForm)
          })
          
          if (res.ok) {
            const idx = this.prizes.findIndex(p => p.id === this.editingPrize.id)
            if (idx !== -1) {
              this.prizes[idx] = { ...this.prizes[idx], ...this.prizeForm }
            }
            this.showToast('奖品已更新')
          }
        } else {
          // 添加新奖品
          const res = await fetch('/api/prizes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.prizeForm)
          })
          
          const data = await res.json()
          if (res.ok) {
            this.prizes.push(data.prize)
            this.showToast('奖品已添加')
          }
        }
        
        this.closePrizeModal()
      } catch (e) {
        this.showToast('操作失败')
      }
    },
    
    async deletePrize(prize) {
      if (!confirm(`确定删除奖品"${prize.name}"吗？`)) return
      
      try {
        const res = await fetch(`/api/prizes/${prize.id}`, {
          method: 'DELETE'
        })
        
        if (res.ok) {
          this.prizes = this.prizes.filter(p => p.id !== prize.id)
          if (this.selectedPrize?.id === prize.id) {
            this.selectedPrize = this.prizes[0] || null
          }
          this.showToast('奖品已删除')
        }
      } catch (e) {
        this.showToast('删除失败')
      }
    },
    
    // 主题和配置方法
    applyTheme(theme) {
      if (theme === 'red') {
        document.documentElement.setAttribute('data-theme', 'red')
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    },
    
    setTheme(theme) {
      this.currentTheme = theme
      this.applyTheme(theme)
      this.saveConfig()
    },
    
    async saveConfig() {
      try {
        await fetch('/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: this.currentTheme,
            displayTitle: this.displayTitle
          })
        })
        this.showToast('配置已保存')
      } catch (e) {
        this.showToast('保存失败')
      }
    }
  }
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  padding: 20px;
}

/* 头部 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 24px;
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 20px;
  color: var(--text-secondary);
}

/* 主内容 */
.main-content {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 20px;
  min-height: calc(100vh - 120px);
}

/* 侧边栏 */
.sidebar {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: var(--text-secondary);
}

.user-list, .winner-list {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
}

.user-item, .winner-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-sm);
  font-size: 14px;
}

.user-item.is-winner {
  opacity: 0.5;
}

.user-name, .winner-name {
  flex: 1;
}

.user-phone {
  color: var(--text-muted);
  font-size: 12px;
}

.winner-badge {
  margin-left: 5px;
}

.winner-prize-tag {
  background: var(--gold-gradient);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.empty {
  text-align: center;
  color: var(--text-muted);
  padding: 30px;
}

/* 抽奖区 */
.lottery-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 奖品选择 */
.prize-selector {
  padding: 20px;
}

.prize-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.prize-header h3 {
  font-size: 16px;
  margin: 0;
}

.btn-add-prize {
  padding: 8px 16px;
  background: var(--gold-gradient);
  border: none;
  border-radius: var(--radius-sm);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add-prize:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(245, 175, 25, 0.4);
}

.prize-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.prize-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.1);
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.prize-item:hover {
  background: rgba(255,255,255,0.15);
}

.prize-item.active {
  border-color: var(--accent-color);
  background: rgba(255, 215, 0, 0.1);
}

.prize-info {
  display: flex;
  flex-direction: column;
}

.prize-info .prize-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.prize-info small {
  font-size: 12px;
  color: var(--text-muted);
}

.prize-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.6;
  transition: all 0.2s;
}

.btn-icon:hover {
  opacity: 1;
  transform: scale(1.2);
}

.btn-icon.btn-delete:hover {
  color: #ef4444;
}

.empty-prize {
  width: 100%;
  text-align: center;
  color: var(--text-muted);
  padding: 20px;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 400px;
  padding: 30px;
  animation: slideUp 0.3s ease;
}

.modal h3 {
  margin-bottom: 25px;
  font-size: 20px;
  text-align: center;
}

.modal .form-group {
  margin-bottom: 20px;
}

.modal .form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.modal .input-field {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: rgba(255,255,255,0.15);
}

.modal-actions .btn-primary {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-sm);
}

/* 抽奖框 */
.draw-box {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.draw-display {
  width: 300px;
  height: 120px;
  background: rgba(0,0,0,0.3);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  border: 2px solid var(--glass-border);
}

.rolling-name {
  font-size: 48px;
  font-weight: 700;
  color: var(--accent-color);
}

.rolling-name.rolling {
  animation: pulse 0.1s infinite;
}

.draw-actions {
  margin-bottom: 20px;
}

.btn-large {
  padding: 18px 60px;
  font-size: 20px;
}

.draw-count {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);
}

.draw-count input {
  width: 60px;
  padding: 8px;
  text-align: center;
  background: rgba(255,255,255,0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

/* 本轮中奖 */
.current-winners {
  padding: 30px;
  text-align: center;
}

.current-winners h3 {
  margin-bottom: 20px;
  color: var(--accent-color);
}

.winner-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.winner-card {
  padding: 20px 30px;
  background: var(--gold-gradient);
  border-radius: var(--radius-md);
}

.winner-card .winner-name {
  font-size: 24px;
  font-weight: 700;
}

.winner-card .winner-prize {
  font-size: 14px;
  opacity: 0.9;
}

/* 配置设置区域 */
.config-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--glass-border);
}

.config-section h4 {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 15px;
}

.config-item {
  margin-bottom: 15px;
}

.config-item label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.theme-switcher {
  display: flex;
  gap: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255,255,255,0.1);
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.theme-btn:hover {
  background: rgba(255,255,255,0.15);
}

.theme-btn.active {
  border-color: var(--accent-color);
  background: rgba(255, 215, 0, 0.1);
  color: var(--accent-color);
}

.theme-btn.theme-red.active {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
  color: #fca5a5;
}

.input-sm {
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-primary);
  background: rgba(255,255,255,0.1);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.3s;
}

.input-sm:focus {
  border-color: var(--accent-color);
}

/* 重置按钮 */
.btn-reset {
  margin-top: 15px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: var(--radius-sm);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-reset:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: #fff;
  padding: 12px 24px;
  border-radius: var(--radius-full);
  z-index: 1000;
}

/* 响应式 */
@media (max-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    order: 2;
  }
  
  .user-list, .winner-list {
    max-height: 200px;
  }
}
</style>
