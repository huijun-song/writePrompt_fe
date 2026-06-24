import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import SignupView from '../views/SignupView.vue'
import QuizRoomsView from '../views/QuizRoomsView.vue'
import PlayView from '../views/PlayView.vue'
import ResultView from '../views/ResultView.vue'
import MyPageView from '../views/MyPageView.vue'
import TeacherStudioView from '../views/TeacherStudioView.vue'
import FireworksTestView from '../views/FireworksTestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/signup', name: 'signup', component: SignupView },
    { path: '/quiz-rooms', name: 'quiz-rooms', component: QuizRoomsView },
    { path: '/play/:id', name: 'play', component: PlayView },
    { path: '/result/:id', name: 'result', component: ResultView },
    { path: '/my-page', name: 'my-page', component: MyPageView },
    { path: '/teacher', name: 'teacher', component: TeacherStudioView },
    { path: '/fireworks-test', name: 'fireworks-test', component: FireworksTestView },
  ],
})

export default router
