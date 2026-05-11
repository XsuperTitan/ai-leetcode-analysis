<template>
  <div class="layout">
    <header class="topbar">
      <h1>AI Fullstack Interview Coach</h1>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/leetcode">LeetCode</RouterLink>
        <RouterLink to="/system-design">System Design</RouterLink>
        <RouterLink to="/interview-questions">Interview Questions</RouterLink>
        <RouterLink to="/favorites">Favorites</RouterLink>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
