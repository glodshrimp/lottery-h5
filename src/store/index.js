import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        users: [],
        winners: [],
        prizes: [],
        isDrawing: false,
        currentPrize: null
    },

    mutations: {
        SET_USERS(state, users) {
            state.users = users
        },
        ADD_USER(state, user) {
            state.users.push(user)
        },
        SET_WINNERS(state, winners) {
            state.winners = winners
        },
        ADD_WINNER(state, winner) {
            state.winners.push(winner)
        },
        SET_PRIZES(state, prizes) {
            state.prizes = prizes
        },
        SET_DRAWING(state, isDrawing) {
            state.isDrawing = isDrawing
        },
        SET_CURRENT_PRIZE(state, prize) {
            state.currentPrize = prize
        }
    },

    getters: {
        availableUsers: state => {
            const winnerIds = state.winners.map(w => w.userId)
            return state.users.filter(u => !winnerIds.includes(u.id))
        },
        userCount: state => state.users.length,
        winnerCount: state => state.winners.length
    },

    actions: {
        async fetchUsers({ commit }) {
            try {
                const res = await fetch('/api/users')
                const data = await res.json()
                commit('SET_USERS', data)
            } catch (e) {
                console.error('获取用户列表失败', e)
            }
        },

        async fetchWinners({ commit }) {
            try {
                const res = await fetch('/api/winners')
                const data = await res.json()
                commit('SET_WINNERS', data)
            } catch (e) {
                console.error('获取中奖列表失败', e)
            }
        },

        async fetchPrizes({ commit }) {
            try {
                const res = await fetch('/api/prizes')
                const data = await res.json()
                commit('SET_PRIZES', data)
            } catch (e) {
                console.error('获取奖品列表失败', e)
            }
        }
    }
})
