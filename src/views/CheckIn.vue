<template>
  <div class="checkin-page">
    <!-- 粒子背景 -->
    <div class="particles">
      <div v-for="i in 50" :key="i" class="particle" :style="particleStyle(i)"></div>
    </div>
    
    <!-- 主内容 -->
    <div class="content animate-slideUp">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-icon animate-float">🎉</div>
        <h1 class="title-lg">幸运抽奖</h1>
        <p class="subtitle">签到参与，赢取大奖</p>
      </div>
      
      <!-- 签到表单 -->
      <div class="form-card glass-card" v-if="!isCheckedIn">
        <div class="form-group">
          <input 
            type="tel" 
            class="input-field" 
            placeholder="请输入手机号"
            v-model="phone"
            maxlength="11"
            @keyup.enter="focusName"
          />
        </div>
        <div class="form-group">
          <input 
            type="text" 
            class="input-field" 
            placeholder="请输入姓名"
            v-model="name"
            ref="nameInput"
            @keyup.enter="handleCheckin"
          />
        </div>
        <button 
          class="btn-primary btn-gold btn-full animate-glow" 
          @click="handleCheckin"
          :disabled="loading"
        >
          <span v-if="loading">签到中...</span>
          <span v-else>立即签到</span>
        </button>
      </div>
      
      <!-- 签到成功 -->
      <div class="success-card glass-card" v-else>
        <div class="success-icon">✅</div>
        <h2 class="success-title">签到成功！</h2>
        <p class="success-info">
          <span class="label">姓名：</span>{{ checkedUser.name }}
        </p>
        <p class="success-info">
          <span class="label">手机号：</span>{{ checkedUser.phoneMask }}
        </p>
        <p class="success-tip">请等待抽奖环节，祝您好运！</p>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats">
        <div class="stat-item">
          <span class="stat-num">{{ userCount }}</span>
          <span class="stat-label">已签到</span>
        </div>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <div class="toast" v-if="errorMsg" @click="errorMsg = ''">
      {{ errorMsg }}
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  name: 'CheckIn',
  
  data() {
    return {
      phone: '',
      name: '',
      loading: false,
      isCheckedIn: false,
      checkedUser: null,
      errorMsg: '',
      userCount: 0,
      socket: null
    }
  },
  
  created() {
    this.initSocket()
    this.fetchUserCount()
  },
  
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect()
    }
  },
  
  methods: {
    initSocket() {
      this.socket = io()
      
      this.socket.on('user-checkin', () => {
        this.userCount++
      })
    },
    
    async fetchUserCount() {
      try {
        const res = await fetch('/api/users')
        const users = await res.json()
        this.userCount = users.length
      } catch (e) {
        console.error(e)
      }
    },
    
    focusName() {
      this.$refs.nameInput.focus()
    },
    
    async handleCheckin() {
      // 验证
      if (!this.phone || !this.name) {
        this.showError('请输入手机号和姓名')
        return
      }
      
      if (!/^1\d{10}$/.test(this.phone)) {
        this.showError('请输入正确的手机号')
        return
      }
      
      this.loading = true
      
      try {
        const res = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: this.phone,
            name: this.name
          })
        })
        
        const data = await res.json()
        
        if (!res.ok) {
          this.showError(data.error || '签到失败')
          return
        }
        
        // 签到成功
        this.isCheckedIn = true
        this.checkedUser = data.user
        this.userCount++
        
      } catch (e) {
        this.showError('网络错误，请重试')
      } finally {
        this.loading = false
      }
    },
    
    showError(msg) {
      this.errorMsg = msg
      setTimeout(() => {
        this.errorMsg = ''
      }, 3000)
    },
    
    particleStyle(i) {
      return {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 4}s`
      }
    }
  }
}
</script>

<style scoped>
.checkin-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
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
  width: 6px;
  height: 6px;
  background: rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: floatParticle 5s ease-in-out infinite;
}

@keyframes floatParticle {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-30px) scale(1.2);
    opacity: 1;
  }
}

/* 内容区 */
.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

/* Logo区域 */
.logo-section {
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 80px;
  margin-bottom: 10px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 18px;
  margin-top: 10px;
}

/* 表单卡片 */
.form-card {
  padding: 40px 30px;
}

.form-group {
  margin-bottom: 20px;
}

.btn-full {
  width: 100%;
  margin-top: 10px;
}

/* 成功卡片 */
.success-card {
  padding: 50px 30px;
}

.success-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success-title {
  font-size: 28px;
  color: #4ade80;
  margin-bottom: 30px;
}

.success-info {
  font-size: 18px;
  margin-bottom: 10px;
  color: var(--text-secondary);
}

.success-info .label {
  color: var(--text-muted);
}

.success-tip {
  margin-top: 30px;
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: var(--radius-sm);
  color: var(--accent-color);
}

/* 统计 */
.stats {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: var(--text-muted);
  font-size: 14px;
}

/* Toast提示 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(239, 68, 68, 0.9);
  color: #fff;
  padding: 12px 24px;
  border-radius: var(--radius-full);
  font-size: 14px;
  z-index: 1000;
  cursor: pointer;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
