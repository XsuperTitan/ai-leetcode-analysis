import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import LeetcodeView from "../views/LeetcodeView.vue";
import SystemDesignView from "../views/SystemDesignView.vue";
import InterviewQuestionsView from "../views/InterviewQuestionsView.vue";
import FavoritesView from "../views/FavoritesView.vue";
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: "/", name: "home", component: HomeView },
        { path: "/leetcode", name: "leetcode", component: LeetcodeView },
        { path: "/system-design", name: "systemDesign", component: SystemDesignView },
        { path: "/interview-questions", name: "interviewQuestions", component: InterviewQuestionsView },
        { path: "/favorites", name: "favorites", component: FavoritesView }
    ]
});
export default router;
