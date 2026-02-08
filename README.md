# 🎉 幸运抽奖系统 - 使用说明

## 📦 文件说明

| 文件 | 适用系统 |
|------|----------|
| `lottery-macos` | Mac 电脑 |
| `lottery-win.exe` | Windows 电脑 |
| `lottery-linux` | Linux 服务器（CentOS 7+） |

---

## 🚀 快速启动

### Mac 用户

1. **首次运行需要授权**
   - 右键点击 `lottery-macos`
   - 选择"打开"
   - 在弹出的对话框中点击"打开"

2. **后续运行**
   - 双击 `lottery-macos` 即可启动

3. **或使用终端**
   ```bash
   chmod +x lottery-macos
   ./lottery-macos
   ```

### Windows 用户

1. 双击 `lottery-win.exe` 运行
2. 如果防火墙提示，请点击"允许访问"

### Linux 用户（CentOS 7+）

1. **上传文件到服务器**
   ```bash
   scp lottery-linux user@your-server:/path/to/app/
   ```

2. **授权并运行**
   ```bash
   chmod +x lottery-linux
   ./lottery-linux
   ```

3. **后台运行（推荐）**
   ```bash
   nohup ./lottery-linux > lottery.log 2>&1 &
   ```

4. **开放端口**
   ```bash
   firewall-cmd --add-port=3000/tcp --permanent
   firewall-cmd --reload
   ```

## 🌐 访问地址

启动成功后，打开浏览器访问：

| 页面 | 地址 |
|------|------|
| 📱 用户签到 | http://localhost:3000 |
| 🎛️ 管理后台 | http://localhost:3000/#/admin |
| 📺 抽奖大屏 | http://localhost:3000/#/display |

---

## 💡 使用流程

### 1️⃣ 准备阶段
- 打开**管理后台**
- 在右侧"显示设置"区域设置**大屏标题**（如：2026年阿里巴巴年会）
- 选择喜欢的**主题风格**（紫蓝/红色）

### 2️⃣ 签到阶段
- 让参会人员扫码或访问签到页面
- 输入手机号和姓名完成签到

### 3️⃣ 抽奖阶段
- 将**大屏页面**投放到投影仪或大屏幕
- 在**管理后台**选择奖品
- 设置抽奖人数
- 点击"开始抽奖"
- 点击"停止"揭晓中奖者

---

## 📁 数据存储

- 所有数据保存在程序同级目录的 `data` 文件夹中
- 文件：`data/data.json`
- 可备份此文件保存抽奖记录

---

## ❓ 常见问题

### 端口被占用
如果3000端口被占用，可设置环境变量更换端口：
- Mac: `PORT=8080 ./lottery-macos`
- Windows: 在cmd中运行 `set PORT=8080 && lottery-win.exe`

### 局域网访问
其他设备可通过IP地址访问，例如：
- 查看本机IP（Mac: `ifconfig`, Windows: `ipconfig`）
- 访问 `http://192.168.x.x:3000`

---

## 🛑 停止程序

- **Mac**: 在终端按 `Ctrl + C`，或关闭终端窗口
- **Windows**: 关闭命令行窗口

---

祝您抽奖活动顺利！🎊
